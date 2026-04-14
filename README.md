# agent_match

`agent_match` is a natural-language human matching app prototype.

A user writes a prompt such as:

> “I need 3 people for basketball in Monastiraki tonight intermediate”

The system then:
- parses the request into structured intent
- searches users in the database
- scores and ranks the best matches
- selects a suggested group
- returns the result through the backend API

This project is an early prototype of a larger product vision:

**prompt → understand intent → search people → rank matches → form group → connect them**

---

## Current Features

- Natural-language request input
- Rule-based prompt parsing
- User matching based on:
  - activity
  - location
  - skill level
  - availability
- Ranked match results
- Suggested group selection
- FastAPI backend
- SQLite database
- Mobile frontend folder included in the project

---

## Example

### User prompt
```text
I need 3 people for basketball in Monastiraki tonight intermediate
