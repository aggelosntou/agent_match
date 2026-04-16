import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

SAMPLE_USERS = [
    dict(email="alice@agentmatch.dev",   password="password123", name="Alice",   interests=["basketball", "tennis"],     location="Monastiraki", skill_level="intermediate", availability=["tonight", "tomorrow"]),
    dict(email="bob@agentmatch.dev",     password="password123", name="Bob",     interests=["basketball"],               location="Monastiraki", skill_level="beginner",     availability=["tonight"]),
    dict(email="diana@agentmatch.dev",   password="password123", name="Diana",   interests=["basketball", "drinks"],     location="Monastiraki", skill_level="intermediate", availability=["tonight"]),
    dict(email="helen@agentmatch.dev",   password="password123", name="Helen",   interests=["basketball", "tennis"],     location="Monastiraki", skill_level="advanced",     availability=["tonight"]),
    dict(email="charlie@agentmatch.dev", password="password123", name="Charlie", interests=["football"],                 location="Athens",      skill_level="advanced",     availability=["tomorrow"]),
    dict(email="ethan@agentmatch.dev",   password="password123", name="Ethan",   interests=["basketball", "football"],   location="Athens",      skill_level="advanced",     availability=["tonight", "tomorrow"]),
    dict(email="nina@agentmatch.dev",    password="password123", name="Nina",    interests=["drinks", "coffee"],         location="Athens",      skill_level="beginner",     availability=["tonight", "tomorrow"]),
    dict(email="fiona@agentmatch.dev",   password="password123", name="Fiona",   interests=["tennis"],                   location="Piraeus",     skill_level="beginner",     availability=["tonight"]),
    dict(email="adam@agentmatch.dev",    password="password123", name="Adam",    interests=["drinks", "coffee"],         location="Budapest",    skill_level="beginner",     availability=["tonight", "tomorrow"]),
    dict(email="petra@agentmatch.dev",   password="password123", name="Petra",   interests=["football", "drinks"],       location="Budapest",    skill_level="intermediate", availability=["tonight"]),
    dict(email="marc@agentmatch.dev",    password="password123", name="Marc",    interests=["football", "basketball"],   location="Barcelona",   skill_level="intermediate", availability=["tonight", "tomorrow"]),
    dict(email="laia@agentmatch.dev",    password="password123", name="Laia",    interests=["tennis", "drinks"],         location="Barcelona",   skill_level="beginner",     availability=["tonight"]),
    dict(email="emma@agentmatch.dev",    password="password123", name="Emma",    interests=["tennis", "coffee"],         location="London",      skill_level="intermediate", availability=["tonight", "tomorrow"]),
    dict(email="jack@agentmatch.dev",    password="password123", name="Jack",    interests=["football", "drinks"],       location="London",      skill_level="beginner",     availability=["tonight"]),
]


def seed():
    existing = supabase.table("profiles").select("id").execute()
    if existing.data:
        print(f"Already have {len(existing.data)} profiles. Skipping.")
        return

    print(f"Seeding {len(SAMPLE_USERS)} users...")
    for u in SAMPLE_USERS:
        # Create auth user
        res = supabase.auth.admin.create_user({
            "email": u["email"],
            "password": u["password"],
            "email_confirm": True,
        })
        user_id = res.user.id

        # Create profile
        supabase.table("profiles").insert({
            "id": user_id,
            "name": u["name"],
            "interests": u["interests"],
            "location": u["location"],
            "skill_level": u["skill_level"],
            "availability": u["availability"],
        }).execute()

        print(f"  ✓ {u['name']} ({u['location']})")

    print("Done.")


if __name__ == "__main__":
    seed()
