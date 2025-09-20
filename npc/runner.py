from npcpy.npc_compiler import NPC
import sys
import json

mikee = NPC(
          name='Mikee',
          primary_directive="""You are to give feedback about the provided source code written in Javascript.
            Remember you are talking to a complete beginner.
            """,
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