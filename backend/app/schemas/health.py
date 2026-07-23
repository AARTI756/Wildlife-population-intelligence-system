from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class HealthMetricItem(BaseModel):
    value: str
    subtext: str
    trend: str
    trendValue: str

class HealthOverview(BaseModel):
    overallScore: int
    statusName: str
    metrics: Dict[str, HealthMetricItem]

class HealthBreakdownPoint(BaseModel):
    name: str
    weight: int
    value: int
    color: str

class HealthTrendPoint(BaseModel):
    year: str
    score: int

class HealthDistributionPoint(BaseModel):
    sector: str
    score: int

class HealthComparisonPoint(BaseModel):
    category: str
    averageScore: int

class HealthAlertPoint(BaseModel):
    id: str
    date: str
    area: str
    indicator: str
    message: str
    severity: str
