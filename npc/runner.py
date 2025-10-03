from npcpy.npc_compiler import NPC
import sys
import json
import base64

mikee = NPC(
          name='Mikee',
          primary_directive="""You are to give feedback about the provided source code. The source code is written in Javascript.
            Remember you are talking to a complete beginner.
            """,
          model='llama3.2',
        #   model='llava:7b',
          provider='ollama'
          )

question = sys.argv[1]
question = base64.b64decode(question).decode('utf-8')

if len(question) == 0:
    print(json.dumps({"error": "No question"}))
    exit(0)

response = mikee.get_llm_response(question)
print(response['response'])