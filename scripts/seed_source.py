"""
Source Data Seeding Script
Populates source_store.customers with 50 realistic, valid customer records.
Enforces 10-digit numeric phone numbers required for FF1 Format-Preserving Encryption.
Supports idempotent execution via ON CONFLICT (customer_id) DO NOTHING.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment configuration
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is missing.", file=sys.stderr)
    sys.exit(1)

# List of 50 realistic customer records
FIRST_NAMES = [
    "Aarav", "Priya", "Rajesh", "Ananya", "Vikram", "Kavita", "Rohan", "Meera",
    "Arjun", "Sneha", "Aditya", "Divya", "Suresh", "Pooja", "Naveen", "Deepa",
    "Karan", "Shreya", "Manoj", "Ritu", "Sanjay", "Neha", "Amit", "Swati",
    "Gaurav", "Sunita", "Harsh", "Tanvi", "Vivek", "Nandini", "Ashok", "Kiran",
    "Rahul", "Preeti", "Alok", "Aarti", "Tarun", "Bhavna", "Pradeep", "Simran",
    "Manish", "Geeta", "Varun", "Rashmi", "Sachin", "Monika", "Dinesh", "Pallavi",
    "Abhishek", "Vandana"
]

LAST_NAMES = [
    "Sharma", "Nair", "Iyer", "Patel", "Malhotra", "Reddy", "Deshmukh", "Joshi",
    "Singhania", "Chatterjee", "Verma", "Menon", "Pillai", "Gupta", "Rao", "Hegde",
    "Bhat", "Mehta", "Chopra", "Kapoor", "Saxena", "Choudhury", "Bose", "Das",
    "Kulkarni", "Aggarwal", "Sengupta", "Banerjee", "Bhardwaj", "Pandey", "Mishra", "Thakur",
    "Soni", "Yadav", "Trivedi", "Shetty", "Gowda", "Naidu", "Nambiar", "Mukherjee",
    "Goswami", "Dubey", "Shukla", "Tripathi", "Purohit", "Mahajan", "Khatri", "Sethi",
    "Bhatnagar", "Somani"
]

CITIES = ["Chennai", "Bengaluru", "Mumbai", "Hyderabad", "Delhi", "Pune", "Kolkata", "Ahmedabad"]
SEGMENTS = ["Premium", "Standard", "Enterprise"]


def generate_customer_records():
    """Generates exactly 50 realistic customer records."""
    customers = []
    base_phone = 9876540000

    for i in range(50):
        cid = f"C{i+1:03d}"
        fname = FIRST_NAMES[i]
        lname = LAST_NAMES[i]
        full_name = f"{fname} {lname}"
        email = f"{fname.lower()}.{lname.lower()}{i+1}@example.com"
        # Exactly 10 digits numeric string for strict FF1 FPE compliance
        mobile = str(base_phone + i + 1)
        city = CITIES[i % len(CITIES)]
        segment = SEGMENTS[i % len(SEGMENTS)]

        customers.append({
            "customer_id": cid,
            "name": full_name,
            "email": email,
            "mobile": mobile,
            "city": city,
            "segment": segment
        })

    return customers


def seed_database():
    """Connects to PostgreSQL and idempotently inserts customer records."""
    print(f"Connecting to database: {DATABASE_URL.split('@')[-1]}...")
    engine = create_engine(DATABASE_URL)

    insert_sql = text("""
        INSERT INTO source_store.customers (customer_id, name, email, mobile, city, segment)
        VALUES (:customer_id, :name, :email, :mobile, :city, :segment)
        ON CONFLICT (customer_id) DO NOTHING;
    """)

    customers = generate_customer_records()

    with engine.begin() as conn:
        print(f"Executing idempotent seed for {len(customers)} records...")
        conn.execute(insert_sql, customers)

        # Count total records in source_store.customers
        result = conn.execute(text("SELECT COUNT(*) FROM source_store.customers;"))
        total_count = result.scalar()

    print(f"Seeding complete! Current record count in source_store.customers: {total_count}")
    return total_count


if __name__ == "__main__":
    count = seed_database()
    if count >= 50:
        print(f"SUCCESS: {count} customer records verified in source_store.customers.")
    else:
        print(f"WARNING: Expected at least 50 records, found {count}.", file=sys.stderr)
        sys.exit(1)
