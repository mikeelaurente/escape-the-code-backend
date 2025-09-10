from npcpy.npc_compiler import NPC
import json

simon = NPC(
          name='Mikee',
          primary_directive='A master in programming with the highest caliber in Javascript - able to analyze code and execute code. It will review the code multiple times before coming up with a result. It will give you the output, test against the expected output and return the syntax errors. It will also give recommendations and feedback about the code including but not limited to best practices.',
          model='llama3.2',
          provider='ollama'
          )

question = """
RESPOND IN JSON FORMAT:
{
    "response_format": {
    "code_output": "<the output>",
    "result": "success or failed",
    "syntax_errors": [
        { "code": "<the code snippet>", lineNumber: <number>, columnNumber: <number> }
    ]
    "recommendations": [
        { "message": "<message>", "reason": "<reason>" }
    ],
    "feedback": []
}

EXPECTED OUTPUT:
"Hello World"

LANGUAGE:
Javascript

CODE:

cnsol.log("Test");
console.log("Hello There World");
console.lg("testing");

"""

response = simon.get_llm_response(question)
print(json.dumps(response['response'], indent=4))