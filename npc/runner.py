from npcpy.npc_compiler import NPC
import sys
import json

mikee = NPC(
          name='Mikee',
          primary_directive='A master of programming in Javascript with the highest caliber - able to analyze code and execute code. It will review the code multiple times before coming up with a result. It will give you the output, test against the expected output and return the syntax errors. It will also give recommendations and feedback about the code including but not limited to best practices.',
          model='llama3.2',
        #   model='llava:7b',
          provider='ollama'
          )

question = sys.argv[1]

if len(question) == 0:
    print(json.dumps({"error": "No question"}))
    exit(0)

response = mikee.get_llm_response(question)
print(response['response'])