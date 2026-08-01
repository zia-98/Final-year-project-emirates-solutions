FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY app.py database.py models.py parser.py recommender.py roadmap_generator.py ai_screener.py internships.csv ./

RUN mkdir -p temp_resumes

EXPOSE 5001

CMD ["python", "app.py"]