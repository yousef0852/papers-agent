from database import Session
from models import Notebook, Nodes, Edges, Messages
from seed_data import seed_data

NOTEBOOK_ID = "seed"


def main() -> None:
    db = Session()
    try:
        existing = db.get(Notebook, NOTEBOOK_ID)
        if existing:
            print(f"Notebook {NOTEBOOK_ID!r} already seeded — skipping.")
            return

        db.add(Notebook(id=NOTEBOOK_ID))
        db.flush()

        for n in seed_data.nodes:
            db.add(
                Nodes(
                    notebook_id=NOTEBOOK_ID,
                    id=n.id,
                    kind=n.kind,
                    parent_id=n.parent_id,
                    label=n.label,
                    year=n.year,
                    category=n.category,
                    summary=n.summary,
                    annotations=n.annotations,
                    x=n.x,
                    y=n.y,
                )
            )

        for e in seed_data.edges:
            db.add(
                Edges(
                    notebook_id=NOTEBOOK_ID,
                    from_id=e.from_node,
                    to_id=e.to,
                    type=e.type,
                )
            )

        for m in seed_data.messages:
            db.add(
                Messages(
                    notebook_id=NOTEBOOK_ID,
                    role=m.role,
                    content=m.content,
                )
            )

        db.commit()
        print(f"Seeded notebook {NOTEBOOK_ID!r}: {len(seed_data.nodes)} nodes, {len(seed_data.edges)} edges, {len(seed_data.messages)} messages.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
