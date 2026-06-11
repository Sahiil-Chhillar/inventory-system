from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import models, schemas


# ── Products ──────────────────────────────────────────────────────────────────
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()


def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    db.delete(db_product)
    db.commit()


# ── Customers ─────────────────────────────────────────────────────────────────
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()


def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()


def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()


def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def update_customer(db: Session, customer_id: int, customer: schemas.CustomerUpdate):
    db_customer = get_customer(db, customer_id)
    update_data = customer.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)

    if not db_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    existing_order = db.query(models.Order).filter(
        models.Order.customer_id == customer_id
    ).first()

    if existing_order:
        raise HTTPException(
            status_code=400,
            detail="Customer has existing orders and cannot be deleted"
        )

    db.delete(db_customer)
    db.commit()


# ── Orders ────────────────────────────────────────────────────────────────────
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()


def create_order(db: Session, order: schemas.OrderCreate):
    total = 0.0
    order_items = []

    for item in order.items:
        product = get_product(db, item.product_id)
        line_total = product.price * item.quantity
        total += line_total
        order_items.append(
            models.OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=product.price,
            )
        )
        # Deduct stock
        product.stock_quantity -= item.quantity

    db_order = models.Order(
        customer_id=order.customer_id,
        total_amount=round(total, 2),
        notes=order.notes,
    )
    db.add(db_order)
    db.flush()

    for oi in order_items:
        oi.order_id = db_order.id
        db.add(oi)

    db.commit()
    db.refresh(db_order)
    return db_order


def update_order_status(db: Session, order_id: int, status: str):
    db_order = get_order(db, order_id)
    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order


def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    # Restore stock
    for item in db_order.items:
        product = get_product(db, item.product_id)
        if product:
            product.stock_quantity += item.quantity
    db.delete(db_order)
    db.commit()


# ── Dashboard ─────────────────────────────────────────────────────────────────
def get_dashboard_stats(db: Session):
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_customers = db.query(func.count(models.Customer.id)).scalar()
    total_orders = db.query(func.count(models.Order.id)).scalar()
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0
    low_stock = db.query(models.Product).filter(models.Product.stock_quantity <= 5).count()
    pending_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.pending).count()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "low_stock_products": low_stock,
        "pending_orders": pending_orders,
    }
