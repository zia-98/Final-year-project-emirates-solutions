
import { toast } from "sonner";

export interface RoadmapWeek {
    week: number;
    title: string;
    goals: string[];
    resources: { title: string; type: "video" | "article" | "course"; url: string }[];
    project: string;
    completed: boolean;
}

export type Roadmap = RoadmapWeek[];

export const generateRoadmap = async (
    programTitle: string, 
    duration: string = "8 weeks",
    studentProfile: string = "N/A",
    availability: string = "N/A"
): Promise<Roadmap> => {
    try {
        console.log("Generating personalized AI roadmap for:", programTitle);

        // Call Python Backend API
        const response = await fetch("http://127.0.0.1:5001/generate-roadmap", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: programTitle,
                duration: duration,
                studentProfile: studentProfile,
                availability: availability
            }),
        });


        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Ensure data.roadmap is actually an array
        if (data.success && data.roadmap && Array.isArray(data.roadmap)) {
            console.log("AI Roadmap Received:", data.roadmap);
            return data.roadmap;
        } else {
            console.error("Failed to generate roadmap or invalid format:", data);
            toast.error("AI Service Unavailable. Generating local roadmap.");
            return getFallbackRoadmap(programTitle);
        }

    } catch (error) {
        console.error("Error generating AI roadmap:", error);
        // Fallback to static data if API fails
        return getFallbackRoadmap(programTitle);
    }
};

// Renaming the old function to use as fallback
const getFallbackRoadmap = (programTitle: string): Roadmap => {
    const baseRoadmap: Roadmap = [];
    const durationWeeks = 8;

    // ... existing logic can remain or be simplified ...
    if (programTitle.includes("AI") || programTitle.includes("Python")) {
        return getAIMLRoadmap();
    }

    // Generic fallback
    for (let i = 1; i <= durationWeeks; i++) {
        baseRoadmap.push({
            week: i,
            title: `Week ${i}: Foundation & Core Concepts`,
            goals: ["Understand the basics", "Complete intial modules", "Setup development environment"],
            resources: [
                { title: "Introduction to the Field", type: "video", url: "https://youtube.com" },
                { title: "Best Practices Guide", type: "article", url: "https://medium.com" }
            ],
            project: `Mini-Project ${i}: Basic Implementation`,
            completed: false
        });
    }

    return baseRoadmap;
};

const getAIMLRoadmap = (): Roadmap => {
    return [
        {
            week: 1,
            title: "Python Fundamentals & Environment Setup",
            goals: ["Master Python syntax (Lists, Dictionaries, Functions)", "Understand Virtual Environments (venv, conda)", "Learn Basic Git commands"],
            resources: [
                { title: "Python for Beginners (Full Course)", type: "video", url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc" },
                { title: "Git & GitHub Crash Course", type: "video", url: "https://www.youtube.com/watch?v=RGOj5yH7evk" }
            ],
            project: "Build a CLI Todo Application",
            completed: false
        },
        {
            week: 2,
            title: "Data Manipulation with NumPy & Pandas",
            goals: ["Understand NumPy arrays vs Lists", "Master Pandas DataFrames", "Perform Data Cleaning & Analysis"],
            resources: [
                { title: "Pandas Tutorial", type: "video", url: "https://www.youtube.com/watch?v=vmEHCJofslg" },
                { title: "NumPy Crash Course", type: "article", url: "https://numpy.org/doc/stable/user/absolute_beginners.html" }
            ],
            project: "Analyze a CSV Dataset (e.g., Titanic or Housing Prices)",
            completed: false
        },
        {
            week: 3,
            title: "Machine Learning Basics (Scikit-Learn)",
            goals: ["Understand Supervised vs Unsupervised Learning", "Implement Linear Regression & Logistic Regression", "Learn Model Evaluation Metrics"],
            resources: [
                { title: "Machine Learning for Everybody", type: "video", url: "https://www.youtube.com/watch?v=i_LwzRVP7bg" },
                { title: "Scikit-Learn Documentation", type: "article", url: "https://scikit-learn.org/stable/" }
            ],
            project: "Predict House Prices using Linear Regression",
            completed: false
        },
        {
            week: 4,
            title: "Deep Learning Foundations (PyTorch/TensorFlow)",
            goals: ["Understand Neural Networks & Backpropagation", "Build a simple MLP", "Intro to Activation Functions"],
            resources: [
                { title: "Neural Networks from Scratch", type: "video", url: "https://www.youtube.com/playlist?list=PLQVvvaa0QuDcjD5BAw2DxE6OF2tius3V3" },
                { title: "PyTorch Blitz", type: "course", url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html" }
            ],
            project: "Digit Classification (MNIST) with a Neural Network",
            completed: false
        },
        {
            week: 5,
            title: "Introduction to LLMs & Prompt Engineering",
            goals: ["Understand Transformer Architecture basics", "Learn Prompt Engineering techniques (Zero-shot, Few-shot)", "Interact with OpenAI API / HuggingFace"],
            resources: [
                { title: "State of GPT", type: "video", url: "https://www.youtube.com/watch?v=bZQun8Y4L2A" },
                { title: "Prompt Engineering Guide", type: "article", url: "https://www.promptingguide.ai/" }
            ],
            project: "Build a Custom Chatbot using OpenAI API",
            completed: false
        },
        {
            week: 6,
            title: "LangChain Fundamentals",
            goals: ["Understand Chains, Agents, and Tools", "Implement RAG (Retrieval Augmented Generation)", "Connect LLMs to external data"],
            resources: [
                { title: "LangChain Crash Course", type: "video", url: "https://www.youtube.com/watch?v=LbT1yp6quS8" },
                { title: "LangChain Docs", type: "article", url: "https://python.langchain.com/docs/get_started/introduction" }
            ],
            project: "Build a 'Chat with your PDF' Application",
            completed: false
        },
        {
            week: 7,
            title: "Building Real-World AI Apps",
            goals: ["Frontend integration (Streamlit or React)", "Deployment strategies", "Optimizing LLM responses"],
            resources: [
                { title: "Streamlit for Data Science", type: "video", url: "https://www.youtube.com/watch?v=ZZ4B0QUHuNc" },
                { title: "Deploying AI Apps", type: "article", url: "https://huggingface.co/docs/hub/spaces" }
            ],
            project: "Develop a full-stack Roadmap Generator App",
            completed: false
        },
        {
            week: 8,
            title: "Final Project & Internship Prep",
            goals: ["Complete a Capstone Project", "Documentation & Code Quality", "Prepare for Internship tasks"],
            resources: [
                { title: "How to succeed in your internship", type: "article", url: "https://github.com/readme/guides/internship-success" }
            ],
            project: "Final Capstone: Integrated AI Solution (Planner + Dashboard)",
            completed: false
        }
    ]
}
