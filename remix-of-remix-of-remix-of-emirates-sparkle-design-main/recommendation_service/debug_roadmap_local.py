
from roadmap_generator import AI_RoadmapGenerator
import os
from dotenv import load_dotenv

# Force load local .env
load_dotenv(".env")
key = os.getenv("GOOGLE_API_KEY")
print(f"Key loaded: {key[:5]}...{key[-5:] if key else 'None'}")

print("Initializing Generator...")
generator = AI_RoadmapGenerator()

print("Generating Roadmap...")
try:
    roadmap = generator.generate("Python Internship", "4 weeks")
    print("Result Type:", type(roadmap))
    print("Result:", roadmap)
except Exception as e:
    print("Exception:", e)
    import traceback
    traceback.print_exc()
