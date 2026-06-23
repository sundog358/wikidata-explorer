FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY agents/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY agents/wikidata_ag2_agent.py ./wikidata_ag2_agent.py
COPY agents/ag2_service.py ./ag2_service.py

EXPOSE 8000

CMD ["uvicorn", "ag2_service:app", "--host", "0.0.0.0", "--port", "8000"]
