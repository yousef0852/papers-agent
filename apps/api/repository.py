from sqlalchemy import select

from database import Session
from models import Edges, Messages, Nodes, Notebook
from schema import Edge, GraphResponse, Message, Node


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
