# Non-Obvious Python Patterns

Patterns that Claude Opus 4.5 may not automatically apply due to framework-specific gotchas, version changes, or unintuitive behaviors.

## Pydantic v2

### ConfigDict vs class Config
```python
# OLD (v1) - WRONG
class User(BaseModel):
    class Config:
        frozen = True

# NEW (v2) - RIGHT
class User(BaseModel):
    model_config = ConfigDict(frozen=True)
```

### model_validate vs parse_obj
```python
# OLD (v1) - DEPRECATED
user = User.parse_obj(data)

# NEW (v2) - RIGHT
user = User.model_validate(data)

# From JSON
user = User.model_validate_json(json_string)
```

### Field Validators Changed
```python
# OLD (v1)
from pydantic import validator

@validator("name")
def validate_name(cls, v):
    return v.strip()

# NEW (v2) - field_validator with mode
from pydantic import field_validator

@field_validator("name")
@classmethod
def validate_name(cls, v: str) -> str:
    return v.strip()
```

### model_dump vs dict
```python
# OLD (v1)
data = user.dict()

# NEW (v2)
data = user.model_dump()
data = user.model_dump_json()  # Direct to JSON
```

## SQLAlchemy 2.0

### Query API Removed
```python
# OLD (1.x) - DEPRECATED
users = session.query(User).filter(User.name == "test").all()

# NEW (2.0) - select() statements
from sqlalchemy import select

stmt = select(User).where(User.name == "test")
result = session.execute(stmt)
users = result.scalars().all()
```

### Mapped Columns
```python
# OLD (1.x) - Column directly
class User(Base):
    name = Column(String(100))

# NEW (2.0) - Mapped annotation
from sqlalchemy.orm import Mapped, mapped_column

class User(Base):
    name: Mapped[str] = mapped_column(String(100))
```

### Async Session Gotchas
```python
# GOTCHA: Lazy loading blocks in async
# This will raise MissingGreenlet error:
async def bad_get_user(session: AsyncSession, id: int):
    user = await session.get(User, id)
    return user.posts  # Lazy load fails!

# RIGHT: Eager load or use run_sync
async def good_get_user(session: AsyncSession, id: int):
    stmt = select(User).options(selectinload(User.posts)).where(User.id == id)
    result = await session.execute(stmt)
    return result.scalar_one()
```

### expire_on_commit Default
```python
# GOTCHA: Objects expire after commit (extra queries!)
async_session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False,  # Add this!
)
```

## FastAPI

### Lifespan vs on_event
```python
# OLD - DEPRECATED
@app.on_event("startup")
async def startup():
    ...

# NEW - Lifespan context manager
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    yield
    # Shutdown
    await db.disconnect()

app = FastAPI(lifespan=lifespan)
```

### Dependency Override Scope
```python
# GOTCHA: Override must match exact dependency function
def get_db():
    return db

# This won't work if route uses Annotated[Session, Depends(get_db)]
# Override must reference same function object
app.dependency_overrides[get_db] = lambda: mock_db
```

### Path Parameter Coercion
```python
# GOTCHA: Path parameters are strings by default
@router.get("/{item_id}")
async def get_item(item_id):  # item_id is str!
    ...

# RIGHT: Add type annotation
@router.get("/{item_id}")
async def get_item(item_id: int):  # Now coerced to int
    ...
```

## pytest-asyncio

### asyncio_mode Configuration
```python
# GOTCHA: Must configure mode in conftest.py or pyproject.toml

# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"

# Or per-test with decorator
@pytest.mark.asyncio
async def test_something():
    ...
```

### Fixture Scope with async
```python
# GOTCHA: async fixtures with session scope need event_loop fixture

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def database():
    # Now this works
    await setup_db()
    yield
    await teardown_db()
```

## returns Library

### Result is Not Exception
```python
# GOTCHA: Result doesn't catch exceptions automatically
from returns.result import Result, Success, Failure

def divide(a: int, b: int) -> Result[float, str]:
    if b == 0:
        return Failure("Division by zero")
    return Success(a / b)

# This does NOT catch exceptions:
def bad_divide(a: int, b: int) -> Result[float, Exception]:
    return Success(a / b)  # Can still raise!

# Use @safe decorator to catch
from returns.result import safe

@safe
def safe_divide(a: int, b: int) -> float:
    return a / b  # Returns Result[float, Exception]
```

### Unwrap Safety
```python
# GOTCHA: unwrap() raises UnwrapFailedError on Failure
result = some_operation()
value = result.unwrap()  # Can raise!

# RIGHT: Pattern match or use value_or
match result:
    case Success(value):
        use(value)
    case Failure(error):
        handle(error)

# Or with default
value = result.value_or(default_value)
```

### IOResult vs Result
```python
# Result: Pure computations
# IOResult: Side effects (logging, random, etc.)

from returns.io import IOResult, IOSuccess, IOFailure

def read_config() -> IOResult[Config, str]:
    # Has side effect (file read)
    try:
        data = Path("config.json").read_text()
        return IOSuccess(Config.parse(data))
    except FileNotFoundError:
        return IOFailure("Config not found")
```

## Type Hints

### Callable vs Protocol
```python
# GOTCHA: Callable doesn't support keyword arguments
from typing import Callable

# This can't express keyword-only args
Callback = Callable[[int, str], None]

# Use Protocol for complex signatures
from typing import Protocol

class Callback(Protocol):
    def __call__(self, value: int, *, label: str) -> None: ...
```

### Generic Variance
```python
from typing import TypeVar, Generic

T = TypeVar("T")  # Invariant
T_co = TypeVar("T_co", covariant=True)  # For return types
T_contra = TypeVar("T_contra", contravariant=True)  # For parameters

# GOTCHA: List is invariant - List[Dog] is not List[Animal]
# Use Sequence for covariant reads
def process_animals(animals: Sequence[Animal]) -> None:
    ...

dogs: list[Dog] = [...]
process_animals(dogs)  # Works with Sequence, not List
```

### ParamSpec for Decorators
```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec("P")
R = TypeVar("R")

def logged(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper
```

## Async Patterns

### asyncio.gather Exception Handling
```python
# GOTCHA: gather() with return_exceptions=False raises first exception
# Other tasks may be cancelled mid-execution

results = await asyncio.gather(task1(), task2(), return_exceptions=True)
# Now results contains exceptions instead of raising
for result in results:
    if isinstance(result, Exception):
        handle_error(result)
```

### Context Variables
```python
# GOTCHA: Regular variables don't work across await points for request context
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id")

async def handler(req):
    request_id.set(req.id)
    await process()  # request_id preserved across await

async def process():
    rid = request_id.get()  # Gets correct value
```

### TaskGroup vs gather
```python
# Python 3.11+ - Prefer TaskGroup for proper cancellation
async with asyncio.TaskGroup() as tg:
    tg.create_task(task1())
    tg.create_task(task2())
# All tasks complete or all are cancelled on first exception
```

## structlog

### Binding Context
```python
# GOTCHA: bind() returns new logger, doesn't modify in place
log = structlog.get_logger()

# WRONG
log.bind(user_id=123)
log.info("message")  # user_id NOT included!

# RIGHT
log = log.bind(user_id=123)
log.info("message")  # user_id included
```

### Async Logging
```python
# GOTCHA: Standard structlog is sync
# Use structlog with async processor for high-throughput

structlog.configure(
    processors=[
        structlog.stdlib.AsyncBoundLogger.wrap_class,
        ...
    ]
)
```

## pytest

### Fixture Dependency
```python
# GOTCHA: Fixtures can depend on other fixtures, but order matters
@pytest.fixture
def db():
    return create_db()

@pytest.fixture
def user(db):  # db fixture runs first
    return db.create_user()

# Request fixture for dynamic fixtures
@pytest.fixture
def dynamic_fixture(request):
    return request.getfixturevalue("some_fixture")
```

### Parametrize with Fixtures
```python
# GOTCHA: Can't directly parametrize with fixture values
# Use indirect parametrization

@pytest.fixture
def user(request):
    return create_user(role=request.param)

@pytest.mark.parametrize("user", ["admin", "guest"], indirect=True)
def test_user_access(user):
    ...
```
