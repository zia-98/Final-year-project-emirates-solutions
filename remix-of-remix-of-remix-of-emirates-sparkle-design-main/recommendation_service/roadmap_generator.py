
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
import os
from dotenv import load_dotenv
import json

# explicit loading of .env from current directory if not found
if not os.getenv("GOOGLE_API_KEY"):
    load_dotenv()
    # Try loading from the same directory as the script if still not found
    if not os.getenv("GOOGLE_API_KEY"):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        load_dotenv(os.path.join(current_dir, ".env"))

# Define output structure
class Resource(BaseModel):
    title: str = Field(description="Title of the resource (video, article, course)")
    type: str = Field(description="Type of resource: 'video', 'article', or 'course'")
    url: str = Field(description="URL to the resource")

class RoadmapWeek(BaseModel):
    week: int = Field(description="Week number")
    title: str = Field(description="Theme/Topic for the week")
    goals: List[str] = Field(description="List of 3-5 learning goals")
    resources: List[Resource] = Field(description="List of 2-3 recommended resources")
    project: str = Field(description="A practical mini-project to build this week")
    completed: bool = Field(default=False, description="Whether the week is completed")

class Roadmap(BaseModel):
    roadmap: List[RoadmapWeek] = Field(description="List of weekly plans")

class AI_RoadmapGenerator:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            print("WARNING: GOOGLE_API_KEY not found in env. AI features will fail.")
            self.llm = None
        else:
            print(f"DEBUG: Using API Key: {self.api_key[:5]}...{self.api_key[-5:] if self.api_key else 'None'}")
            # Use gemini-3-flash-preview for best compatibility and speed in this environment
            self.llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", google_api_key=self.api_key, max_retries=1)
        
        self.parser = PydanticOutputParser(pydantic_object=Roadmap)

        # Initialize DuckDuckGo Search
        from langchain_community.tools import DuckDuckGoSearchRun
        self.search = DuckDuckGoSearchRun()

        self.prompt = PromptTemplate(
            template="""
            You are an expert technical curriculum designer efficiently designing a "Deep Research" internship roadmap.
            Your goal is to create a university-grade, project-heavy {duration} learning path for a {title} intern.

            --- STUDENT CONTEXT ---
            Student Profile: {student_profile}
            Availability: {availability}
            -----------------------------

            --- DEEP RESEARCH CONTEXT ---
            The following are real-time search results for the best current resources:
            {search_results}
            -----------------------------

            ### INSTRUCTIONS:
            1. **Personalization**: Tailor the roadmap to the student's background (education/experience) and their stated availability ({availability}). If they have limited time, focus on core essentials. If they have more time, include advanced modules.
            2. **Curriculum Design**: Structure this like a serious bootcamp. Week 1 should dive into professional tools early.
            3. **Resource Selection**: 
               - You MUST use the **exact URLs** provided in the search context where possible. 
               - Prioritize "Official Documentation", "High-quality YouTube Playlists", and "GeeksforGeeks/Medium engineering blogs".
            4. **Project-Centric**: Every week MUST end with a tangible mini-project.
            
            ### FORMAT:
            For each week of the {duration}:
            - **Title**: Professional module name.
            - **Goals**: 3-4 granular technical skills.
            - **Resources**: 2-3 high-quality links.
            - **Project**: A specific 1-sentence spec.
            - **Completed**: false

            {format_instructions}
            """,
            input_variables=["title", "duration", "search_results", "student_profile", "availability"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )

    def generate(self, title, duration="8 weeks", student_profile="N/A", availability="N/A"):
        if not self.llm:
            return {"error": "AI service not configured (missing API key)"}
        
        import time
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        start_time = time.time()
        try:
            print(f"Starting Deep Research for {title} (Student: {student_profile[:50]}..., Availability: {availability})...")
            
            # --- OPTIMIZED SEARCH STRATEGY ---
            search_context = ""
            queries = [
                f"{title} internship roadmap curriculum {duration} weeks",
                f"best free learning resources for {title}"
            ]

            def run_single_search(q):
                try:
                    res = self.search.run(q)
                    return f"\n\n--- Results for '{q}' ---\n{res[:2000]}" 
                except Exception as e:
                    return f"\n\n--- Search failed for '{q}': {e}"

            with ThreadPoolExecutor(max_workers=2) as executor:
                future_to_query = {executor.submit(run_single_search, q): q for q in queries}
                for future in as_completed(future_to_query):
                    search_context += future.result()
            
            research_time = time.time()
            search_context = search_context[:4000]
            print(f"Research complete in {research_time - start_time:.2f}s.")

            # --- GENERATION ---
            _input = self.prompt.format_prompt(
                title=title, 
                duration=duration,
                search_results=search_context,
                student_profile=student_profile,
                availability=availability
            )
            
            print("Generating personalized roadmap with Gemini Flash...")
            output = self.llm.invoke(_input.to_string())
            
            try:
                parsed_output = self.parser.parse(output.content)
            except Exception as parse_err:
                print(f"Warning: Initial parsing failed. Attempting to fix with LLM...")
                from langchain.output_parsers import OutputFixingParser
                fixing_parser = OutputFixingParser.from_llm(parser=self.parser, llm=self.llm)
                parsed_output = fixing_parser.parse(output.content)
            
            end_time = time.time()
            print(f"Generation successful in {end_time - research_time:.2f}s.")
            
            return parsed_output.dict()["roadmap"]
        except Exception as e:
            print(f"CRITICAL ERROR generating roadmap: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e), "use_fallback": True}


    # Mock generation for fallback/testing
    def mock_generate(self, title):
        return [
            {
                "week": 1,
                "title": f"Introduction to {title}",
                "goals": ["Understand basics", "Setup environment"],
                "resources": [{"title": "Intro Video", "type": "video", "url": "https://youtube.com"}],
                "project": "Hello World App",
                "completed": False
            }
        ]
