"""
backend/app/utils/manage_admin.py

Administrative CLI Utility to safely promote or demote users in PostgreSQL.
Usage:
    python -m app.utils.manage_admin promote <email>
    python -m app.utils.manage_admin demote <email>
    python -m app.utils.manage_admin list
"""

import sys
import argparse
from app.database import SessionLocal
from app.models.user import User


def promote_user(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return False
        user.is_admin = True
        db.commit()
        print(f"Success: User '{user.name}' ({user.email}) has been granted administrative privileges.")
        return True
    finally:
        db.close()


def demote_user(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return False
        user.is_admin = False
        db.commit()
        print(f"Success: Removed administrative privileges from '{user.name}' ({user.email}).")
        return True
    finally:
        db.close()


def list_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.is_admin == True).all()
        print(f"Total administrators: {len(admins)}")
        for a in admins:
            print(f" - {a.name} ({a.email}) [ID: {a.id}]")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage B2B2H Admin Privileges")
    subparsers = parser.add_subparsers(dest="action", required=True)

    promote_parser = subparsers.add_parser("promote", help="Promote a user to admin")
    promote_parser.add_argument("email", help="Email of the user to promote")

    demote_parser = subparsers.add_parser("demote", help="Demote an admin to normal student")
    demote_parser.add_argument("email", help="Email of the admin to demote")

    list_parser = subparsers.add_parser("list", help="List all current administrators")

    args = parser.parse_args()

    if args.action == "promote":
        promote_user(args.email)
    elif args.action == "demote":
        demote_user(args.email)
    elif args.action == "list":
        list_admins()
