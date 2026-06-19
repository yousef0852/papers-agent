from sqlalchemy import select

from database import Session
from models import Edges, Messages, Nodes, Notebook, WaitlistEntry
from schema import Edge, GraphResponse, Message, Node
from seed_data import seed_data


def get_notebook(notebook_id: str) -> GraphResponse:
    with Session() as session:
        notebook = session.get(Notebook, notebook_id)
        if notebook is None:
            raise ValueError(f"Notebook {notebook_id!r} not found")

        db_nodes = session.scalars(
            select(Nodes).where(Nodes.notebook_id == notebook_id)
        ).all()
        db_edges = session.scalars(
            select(Edges).where(Edges.notebook_id == notebook_id)
        ).all()
        db_messages = session.scalars(
            select(Messages).where(Messages.notebook_id == notebook_id)
        ).all()

        nodes = [
            Node(
                id=n.id,
                kind=n.kind,
                parent_id=n.parent_id,
                label=n.label,
                year=n.year,
                category=n.category,
                summary=n.summary,
                annotations=n.annotations or [],
                x=n.x,
                y=n.y,
            )
            for n in db_nodes
        ]

        edges = [
            Edge.model_validate({"from": e.from_id, "to": e.to_id, "type": e.type})
            for e in db_edges
        ]

        messages = [
            Message(role=m.role, content=m.content)
            for m in db_messages
        ]

        return GraphResponse(nodes=nodes, edges=edges, messages=messages)


def save_notebook(notebook_id: str, graph: GraphResponse):
    with Session() as db:
        try:
            existing = db.get(Notebook, notebook_id)
            if not existing:
                raise ValueError(f"Notebook {notebook_id!r} does not exist")

            db.query(Edges).filter(Edges.notebook_id == notebook_id).delete()
            db.query(Messages).filter(Messages.notebook_id == notebook_id).delete()
            db.query(Nodes).filter(Nodes.notebook_id == notebook_id).delete()

            new_nodes = [
                Nodes(
                    id=node.id,
                    notebook_id=notebook_id,
                    kind=node.kind,
                    parent_id=node.parent_id,
                    label=node.label,
                    year=node.year,
                    category=node.category,
                    summary=node.summary,
                    annotations=node.annotations or [],
                    x=node.x,
                    y=node.y,
                )
                for node in graph.nodes
            ]

            new_edges = [
                Edges(
                    from_id=edge.from_node,
                    to_id=edge.to,
                    notebook_id=notebook_id,
                    type=edge.type,
                )
                for edge in graph.edges
            ]

            new_messages = [
                Messages(
                    notebook_id=notebook_id,
                    role=message.role,
                    content=message.content,
                )
                for message in graph.messages
            ]

            if new_nodes:
                db.add_all(new_nodes)
            if new_edges:
                db.add_all(new_edges)
            if new_messages:
                db.add_all(new_messages)

            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Failed to save notebook {notebook_id}: {str(e)}")
            raise e


def reset_notebook_to_seed(notebook_id: str) -> GraphResponse:
    save_notebook(notebook_id, seed_data)
    return seed_data


def add_waitlist_entry(email: str, source: str, note: str | None = None) -> None:
    with Session() as session:
        session.add(WaitlistEntry(email=email, source=source, note=note))
        session.commit()
