from .repository import PropertyRepository
from .schemas import PropertyOut, Status


class PropertyService:
    def __init__(self, repo: PropertyRepository) -> None:
        self.repo = repo

    def search(
        self,
        *,
        quartier: str | None,
        type_: str | None,
        status: Status | None,
        max_price: int | None,
        limit: int,
        offset: int,
    ) -> list[PropertyOut]:
        items = [
            p
            for p in self.repo.list()
            if (quartier is None or p.q == quartier)
            and (type_ is None or p.type == type_)
            and (status is None or p.status == status)
            and (max_price is None or p.price <= max_price)
        ]
        return items[offset : offset + limit]

    def get(self, ref: str) -> PropertyOut | None:
        return self.repo.get(ref)
