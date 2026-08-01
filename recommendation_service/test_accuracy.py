
import sys
import os
# Add current directory to path so we can import recommender
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from recommender import InternshipRecommender

def test_accuracy():
    recommender = InternshipRecommender(data_path='internships.csv')
    if not recommender.load_data():
        print("Failed to load data")
        return

    recommender.create_features()
    recommender.train()

    # User Profile: Advanced Python, AI/ML preference
    profile = {
        "skills": "Coding",
        "interests": "AI, Machine Learning, Data Science",
        "education": "bachelors",
        "preferredDomain": "AI/ML",
        "pythonLevel": "Advanced",
        "sqlLevel": "Intermediate",
        "javaLevel": "Beginner",
        "availability": "20",
        "resumeText": "Experienced in Python and AI projects. Interested in machine learning models."
    }

    print("\n--- Testing Recommendations for High-Level Python & AI/ML Preference ---")
    recommendations = recommender.recommend(profile, top_n=5)

    for i, rec in enumerate(recommendations):
        print(f"{i+1}. {rec['title']} ({rec['domain']}) - Match: {rec['matchScore']}%")
        print(f"   Reason: {rec['reasoning']}")
        print(f"   Skills: {rec['skills_required']}")
        print("-" * 30)

if __name__ == "__main__":
    test_accuracy()
