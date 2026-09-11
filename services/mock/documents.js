import { documents, extractions, evidence } from "./data";

export async function getDocuments() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return documents;
}

export async function getDocumentById(documentId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const document = documents.find(
    (item) => item.id === documentId
  );

  if (!document) {
    throw new Error("Document not found.");
  }

  return {
    ...document,

    extractions: extractions.filter(
      (item) => item.documentId === documentId
    ),

    evidence: evidence.filter(
      (item) => item.documentId === documentId
    ),
  };
}

export async function getDocumentsByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const parcelDocuments = documents.filter(
    (document) => document.parcelId === parcelId
  );

  return parcelDocuments;
}

export async function getDocumentExtractions(documentId) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return extractions.filter(
    (item) => item.documentId === documentId
  );
}