import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI API client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Define the system prompt
SYSTEM_PROMPT = """
You are an SAP ABAP and S/4HANA migration expert. Analyze the following ABAP code and provide:
1. Compatibility with S/4HANA.
2. Deprecated functions or APIs.
3. Suggested modern replacements.
4. Performance optimizations for HANA.
5. A refactored version of the code compatible with S/4HANA.

Return the output as a JSON object with these fields:
compatibility: string
issues: list of strings
recommendations: list of strings
converted_code: string (the refactored ABAP code)
"""

# Function to analyze ABAP code using OpenAI
def analyze_abap(code: str):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this ABAP code:\n\n{code}"}
        ]
    )
    return response.choices[0].message.content
