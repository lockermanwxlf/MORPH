import os
from pydoc import cli
from typing import Annotated

from azure.cosmos.aio import CosmosClient as Client, DatabaseProxy
from azure.identity import DefaultAzureCredential
from fastapi import Depends

from config import COSMOS_DATABASE_NAME


_client: Client | None = None


async def init_cosmos():
    global _client
    if _client is None:
        credential = DefaultAzureCredential()
        _client = Client(url=os.environ["COSMOS_ENDPOINT"], credential=credential)


async def cleanup_cosmos():
    global _client
    if _client:
        await _client.close()
        _client = None


def get_cosmos_client():
    if not _client:
        raise RuntimeError("CosmosClient not initialized.")
    return _client


CosmosClient = Annotated[Client, Depends(get_cosmos_client)]


def get_cosmos_database(client: CosmosClient):
    database = client.get_database_client(COSMOS_DATABASE_NAME)
    return database


CosmosDatabase = Annotated[DatabaseProxy, Depends(get_cosmos_database)]

__all__ = ["CosmosClient", "CosmosDatabase", "init_cosmos", "cleanup_cosmos"]
