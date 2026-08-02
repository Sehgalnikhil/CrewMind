import re

with open("backend/app/api/invitations.py", "r") as f:
    content = f.read()

# Find the revoke_invitation function block
match = re.search(r'(@router\.delete\("/{invitation_id}".*?)(?=@router|class LinkInviteResponse)', content, re.DOTALL)
if match:
    block = match.group(1)
    # Remove it from its current position
    content = content.replace(block, "")
    # Append it to the end of the file
    content += "\n\n" + block.strip() + "\n"
    
    with open("backend/app/api/invitations.py", "w") as f:
        f.write(content)
    print("Fixed routing order")
else:
    print("Could not find the block")
