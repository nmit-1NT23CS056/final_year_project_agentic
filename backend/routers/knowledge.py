from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil
import tempfile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

CHROMA_PATH = "./chroma_db"

def get_vectorstore():
    # We use Google's free embedding model!
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    return Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for RAG.")
        
    try:
        # 1. Save uploaded PDF to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        # 2. Load the PDF text
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        
        # 3. Split the text into smaller semantic chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        # 4. Embed the chunks into ChromaDB
        vectorstore = get_vectorstore()
        vectorstore.add_documents(documents=splits)
        
        # Cleanup
        os.unlink(tmp_path)
        
        return {
            "message": f"Successfully analyzed and embedded {len(splits)} knowledge chunks from {file.filename} into ChromaDB."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
