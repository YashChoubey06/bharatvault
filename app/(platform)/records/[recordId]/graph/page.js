"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Network,
  User,
  FileText,
  ArrowRightLeft,
  RefreshCw,
  Map,
  Scale,
  ShieldAlert,
  CircleAlert,
  CheckCircle2,
  Database,
} from "lucide-react";

import { getParcelById } from "@/services/api/parcels";
import { getEvidenceByParcel } from "@/services/api/validation";
import { getDocumentsByParcel } from "@/services/api/documents";

import styles from "./graph.module.css";

export default function EvidenceGraphPage() {
  const params = useParams();
  const router = useRouter();

  const [parcel, setParcel] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGraphData() {
      try {
        setLoading(true);
        setError("");

        const parcelId = params.recordId;

        const [parcelData, evidenceData, documentData] = await Promise.all([
          getParcelById(parcelId),
          getEvidenceByParcel(parcelId),
          getDocumentsByParcel(parcelId),
        ]);

        setParcel(parcelData);
        setEvidence(evidenceData || []);
        setDocuments(documentData || []);
      } catch (err) {
        setError(err.message || "Unable to load evidence graph.");
      } finally {
        setLoading(false);
      }
    }

    if (params.recordId) {
      loadGraphData();
    }
  }, [params.recordId]);

  const graphData = useMemo(() => {
    if (!parcel) return null;

    return buildGraphData(parcel, evidence, documents);
  }, [parcel, evidence, documents]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Building evidence graph...</p>
      </div>
    );
  }

  if (error || !parcel || !graphData) {
    return (
      <div className={styles.emptyState}>
        <CircleAlert size={28} />
        <h2>Unable to load evidence graph</h2>
        <p>{error || "Parcel data was not found."}</p>

        <button className={styles.backButton} onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <button
            className={styles.backLink}
            onClick={() => router.push(`/records/${parcel.id}`)}
          >
            <ArrowLeft size={16} />
            Back to Record
          </button>

          <div className={styles.titleRow}>
            <div className={styles.titleIcon}>
              <Network size={22} />
            </div>

            <div>
              <h1>Evidence Graph</h1>
              <p>
                Explore relationships between the parcel, ownership, documents,
                transactions and verification evidence.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.demoBadge}>
          <Database size={14} />
          Demo Evidence Graph
        </div>
      </div>

      {/* Summary */}
      <section className={styles.summaryGrid}>
        <SummaryCard
          icon={<Network size={18} />}
          label="Graph Nodes"
          value={graphData.nodes.length}
          description="Connected evidence entities"
        />

        <SummaryCard
          icon={<ArrowRightLeft size={18} />}
          label="Relationships"
          value={graphData.edges.length}
          description="Evidence relationships"
        />

        <SummaryCard
          icon={<FileText size={18} />}
          label="Documents"
          value={documents.length}
          description="Linked source documents"
        />

        <SummaryCard
          icon={<ShieldAlert size={18} />}
          label="Risk"
          value={parcel.risk?.score !== undefined ? parcel.risk.score : "—"}
          description={
            parcel.risk?.level
              ? `${parcel.risk.level} priority`
              : "Risk assessment"
          }
        />
      </section>

      {/* Main Workspace */}
      <section className={styles.workspace}>
        <div className={styles.graphPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Parcel Evidence Network</h2>
              <p>
                Select any node to inspect its relationship with the parcel.
              </p>
            </div>

            <div className={styles.legend}>
              <LegendItem className={styles.parcelLegend} label="Parcel" />
              <LegendItem className={styles.ownerLegend} label="Owner" />
              <LegendItem className={styles.documentLegend} label="Document" />
              <LegendItem
                className={styles.transactionLegend}
                label="Transaction"
              />
              <LegendItem
                className={styles.validationLegend}
                label="Evidence"
              />
            </div>
          </div>

          <div className={styles.graphCanvas}>
            <div className={styles.graphInner}>
              {graphData.edges.map((edge) => (
                <GraphEdge key={edge.id} edge={edge} nodes={graphData.nodes} />
              ))}

              {graphData.nodes.map((node) => (
                <GraphNode
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  onClick={() => setSelectedNode(node)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <aside className={styles.detailsPanel}>
          {selectedNode ? (
            <NodeDetails
              node={selectedNode}
              parcel={parcel}
              onClose={() => setSelectedNode(null)}
            />
          ) : (
            <GraphOverview parcel={parcel} graphData={graphData} />
          )}
        </aside>
      </section>

      {/* Relationship explanation */}
      <section className={styles.relationshipSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>RELATIONSHIP MODEL</span>

            <h2>How the evidence is connected</h2>

            <p>
              Bharat Vault treats a parcel as the central evidence entity and
              connects independent records around it.
            </p>
          </div>
        </div>

        <div className={styles.relationshipGrid}>
          {graphData.relationships.map((relationship) => (
            <RelationshipCard
              key={relationship.id}
              relationship={relationship}
            />
          ))}
        </div>
      </section>

      {/* Interpretation */}
      <section className={styles.interpretation}>
        <div className={styles.interpretationIcon}>
          <ShieldAlert size={20} />
        </div>

        <div>
          <h3>Evidence Graph Interpretation</h3>

          <p>
            The graph does not independently establish legal title. It provides
            a connected view of available evidence so officers can understand
            ownership, transactions, documents, spatial records and detected
            conflicts in one place.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   Summary Card
--------------------------------------------------------- */

function SummaryCard({ icon, label, value, description }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryIcon}>{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Legend
--------------------------------------------------------- */

function LegendItem({ className, label }) {
  return (
    <div className={styles.legendItem}>
      <span className={`${styles.legendDot} ${className}`} />
      {label}
    </div>
  );
}

/* ---------------------------------------------------------
   Graph Node
--------------------------------------------------------- */

function GraphNode({ node, selected, onClick }) {
  const Icon = node.icon;

  return (
    <button
      className={`${styles.graphNode} ${styles[`node_${node.type}`] || ""} ${
        selected ? styles.selectedNode : ""
      }`}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
      }}
      onClick={onClick}
    >
      <span className={styles.nodeIcon}>
        <Icon size={18} />
      </span>

      <span className={styles.nodeLabel}>{node.label}</span>

      {node.subLabel && (
        <span className={styles.nodeSubLabel}>{node.subLabel}</span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------
   Graph Edge
--------------------------------------------------------- */

function GraphEdge({ edge, nodes }) {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);

  if (!source || !target) return null;

  const dx = target.x - source.x;
  const dy = target.y - source.y;

  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className={styles.edge}
      style={{
        left: `${source.x}%`,
        top: `${source.y}%`,
        width: `${distance}%`,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <span>{edge.label}</span>
    </div>
  );
}

/* ---------------------------------------------------------
   Node Details
--------------------------------------------------------- */

function NodeDetails({ node, parcel, onClose }) {
  const Icon = node.icon;

  return (
    <div className={styles.nodeDetails}>
      <div className={styles.detailsHeader}>
        <div className={styles.detailsTitle}>
          <div className={styles.detailsIcon}>
            <Icon size={20} />
          </div>

          <div>
            <span>{node.typeLabel}</span>
            <h3>{node.label}</h3>
          </div>
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.detailsBody}>
        <DetailRow label="Entity Type" value={node.typeLabel} />

        {node.subLabel && <DetailRow label="Reference" value={node.subLabel} />}

        {node.description && (
          <div className={styles.descriptionBlock}>
            <span>Description</span>
            <p>{node.description}</p>
          </div>
        )}

        {node.metadata &&
          Object.entries(node.metadata).map(([key, value]) => (
            <DetailRow key={key} label={formatLabel(key)} value={value} />
          ))}

        <div className={styles.connectionBox}>
          <Network size={16} />

          <div>
            <strong>Connected to Parcel</strong>
            <span>{parcel.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Graph Overview
--------------------------------------------------------- */

function GraphOverview({ parcel, graphData }) {
  return (
    <div className={styles.graphOverview}>
      <div className={styles.overviewIcon}>
        <Network size={22} />
      </div>

      <span className={styles.eyebrow}>GRAPH INTELLIGENCE</span>

      <h2>Evidence Network</h2>

      <p>
        This view connects the independent evidence associated with this parcel.
      </p>

      <div className={styles.parcelIdentity}>
        <span>Central Parcel</span>

        <strong>{parcel.id}</strong>

        <small>Survey {parcel.surveyNumber || "—"}</small>
      </div>

      <div className={styles.instruction}>
        <Network size={16} />

        <span>
          Click a node in the graph to inspect its evidence and metadata.
        </span>
      </div>

      <div className={styles.graphStats}>
        <div>
          <strong>{graphData.nodes.length}</strong>
          <span>Nodes</span>
        </div>

        <div>
          <strong>{graphData.edges.length}</strong>
          <span>Links</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Detail Row
--------------------------------------------------------- */

function DetailRow({ label, value }) {
  return (
    <div className={styles.detailRow}>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}

/* ---------------------------------------------------------
   Relationship Card
--------------------------------------------------------- */

function RelationshipCard({ relationship }) {
  const Icon = relationship.icon;

  return (
    <div className={styles.relationshipCard}>
      <div className={styles.relationshipIcon}>
        <Icon size={18} />
      </div>

      <div>
        <span>{relationship.type}</span>

        <h3>
          {relationship.source} <ArrowRight size={14} /> {relationship.target}
        </h3>

        <p>{relationship.description}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Graph Builder
--------------------------------------------------------- */

function buildGraphData(parcel, evidence, documents) {
  const nodes = [];
  const edges = [];

  const addNode = (node) => {
    if (!nodes.some((item) => item.id === node.id)) {
      nodes.push(node);
    }
  };

  const addEdge = (edge) => {
    edges.push({
      id: edge.id || `${edge.source}-${edge.target}`,
      ...edge,
    });
  };

  /* Central Parcel */
  addNode({
    id: `parcel-${parcel.id}`,
    type: "parcel",
    typeLabel: "Parcel",
    label: parcel.id,
    subLabel: parcel.surveyNumber
      ? `Survey ${parcel.surveyNumber}`
      : "Land Parcel",
    x: 50,
    y: 48,
    icon: Map,
    description:
      "Central parcel entity around which supporting evidence is connected.",
    metadata: {
      village: parcel.village?.name || "—",
      khata: parcel.khataNumber || "—",
      area: parcel.recordedArea ? `${parcel.recordedArea} ha` : "—",
      status: parcel.status || "—",
    },
  });

  /* Owner */
  if (parcel.owner) {
    addNode({
      id: `owner-${parcel.owner.id}`,
      type: "owner",
      typeLabel: "Owner",
      label: parcel.owner.name,
      subLabel: "Current Recorded Owner",
      x: 18,
      y: 24,
      icon: User,
      description:
        "Current owner recorded against the parcel in the available land record.",
      metadata: {
        ownerId: parcel.owner.id,
        ownershipStatus: "Current",
      },
    });

    addEdge({
      source: `parcel-${parcel.id}`,
      target: `owner-${parcel.owner.id}`,
      label: "OWNED BY",
    });
  }

  /* Registration */
  if (parcel.registration) {
    addNode({
      id: `registration-${parcel.registration.id}`,
      type: "transaction",
      typeLabel: "Registration",
      label: parcel.registration.id,
      subLabel: "Registered Transaction",
      x: 82,
      y: 22,
      icon: ArrowRightLeft,
      description: "Registration evidence associated with the parcel.",
      metadata: {
        date:
          parcel.registration.date ||
          parcel.registration.registrationDate ||
          "—",
        seller:
          parcel.registration.sellerName || parcel.registration.seller || "—",
        buyer:
          parcel.registration.buyerName || parcel.registration.buyer || "—",
        area:
          parcel.registration.area !== undefined
            ? `${parcel.registration.area} ha`
            : "—",
      },
    });

    addEdge({
      source: `parcel-${parcel.id}`,
      target: `registration-${parcel.registration.id}`,
      label: "REGISTERED",
    });
  }

  /* Mutation */
  if (parcel.mutation) {
    addNode({
      id: `mutation-${parcel.mutation.id}`,
      type: "mutation",
      typeLabel: "Mutation",
      label: parcel.mutation.id,
      subLabel: "Mutation Record",
      x: 18,
      y: 73,
      icon: RefreshCw,
      description:
        "Mutation event recording an ownership or land-record change.",
      metadata: {
        date: parcel.mutation.date || parcel.mutation.mutationDate || "—",
        type: parcel.mutation.type || "—",
        status: parcel.mutation.status || "—",
      },
    });

    addEdge({
      source: `parcel-${parcel.id}`,
      target: `mutation-${parcel.mutation.id}`,
      label: "MUTATION",
    });
  }

  /* GIS */
  if (parcel.gis) {
    addNode({
      id: `gis-${parcel.gis.id}`,
      type: "gis",
      typeLabel: "GIS Record",
      label: parcel.gis.id,
      subLabel: "Spatial Evidence",
      x: 82,
      y: 70,
      icon: Map,
      description:
        "Spatial record representing the parcel geometry and measured area.",
      metadata: {
        area: parcel.gis.area !== undefined ? `${parcel.gis.area} ha` : "—",
        source: parcel.gis.source || "—",
        updated: parcel.gis.updatedAt || parcel.gis.updatedDate || "—",
      },
    });

    addEdge({
      source: `parcel-${parcel.id}`,
      target: `gis-${parcel.gis.id}`,
      label: "SPATIAL",
    });
  }

  /* Court */
  if (parcel.courtCase) {
    addNode({
      id: `court-${parcel.courtCase.id}`,
      type: "court",
      typeLabel: "Court Case",
      label: parcel.courtCase.caseNumber || parcel.courtCase.id,
      subLabel: parcel.courtCase.status || "Dispute",
      x: 50,
      y: 88,
      icon: Scale,
      description: "Court/dispute information associated with the parcel.",
      metadata: {
        type: parcel.courtCase.caseType || "—",
        status: parcel.courtCase.status || "—",
        court: parcel.courtCase.courtName || "—",
      },
    });

    addEdge({
      source: `parcel-${parcel.id}`,
      target: `court-${parcel.courtCase.id}`,
      label: "DISPUTE",
    });
  }

  /* Documents */
  documents.slice(0, 3).forEach((document, index) => {
    const positions = [
      { x: 8, y: 48 },
      { x: 92, y: 48 },
      { x: 50, y: 8 },
    ];

    const position = positions[index];

    addNode({
      id: `document-${document.id}`,
      type: "document",
      typeLabel: "Document",
      label: document.documentNumber || document.id,
      subLabel: document.documentType || "Source Document",
      x: position.x,
      y: position.y,
      icon: FileText,
      description:
        "Source document from which evidence can be extracted and traced.",
      metadata: {
        type: document.documentType || "—",
        language: document.language || "—",
        confidence:
          document.ocrConfidence !== undefined
            ? `${document.ocrConfidence}%`
            : "—",
      },
    });

    addEdge({
      source: `parcel-${parcel.id}`,
      target: `document-${document.id}`,
      label: "EVIDENCE",
    });
  });

  /* Evidence */
  if (evidence.length > 0) {
    addNode({
      id: `evidence-${parcel.id}`,
      type: "evidence",
      typeLabel: "Evidence",
      label: `${evidence.length} Evidence Items`,
      subLabel: "Field-level provenance",
      x: 28,
      y: 91,
      icon: CheckCircle2,
      description:
        "Field-level evidence links extracted values to their original sources.",
      metadata: {
        items: evidence.length,
        highConfidence: evidence.filter(
          (item) => Number(item.confidence || 0) >= 90
        ).length,
      },
    });

    addEdge({
      source: `parcel-${parcel.id}`,
      target: `evidence-${parcel.id}`,
      label: "SUPPORTED BY",
    });
  }

  const relationships = [
    {
      id: "ownership",
      type: "OWNERSHIP",
      source: parcel.id,
      target: parcel.owner?.name || "Owner",
      description: "Connects the parcel with its current recorded owner.",
      icon: User,
    },
    {
      id: "transaction",
      type: "TRANSACTION",
      source: parcel.id,
      target: parcel.registration?.id || "Registration",
      description:
        "Links registration evidence used to understand transfer history.",
      icon: ArrowRightLeft,
    },
    {
      id: "mutation",
      type: "MUTATION",
      source: parcel.id,
      target: parcel.mutation?.id || "Mutation",
      description: "Links the mutation record associated with the parcel.",
      icon: RefreshCw,
    },
    {
      id: "spatial",
      type: "SPATIAL",
      source: parcel.id,
      target: parcel.gis?.id || "GIS",
      description: "Connects textual parcel information with spatial evidence.",
      icon: Map,
    },
    {
      id: "dispute",
      type: "DISPUTE",
      source: parcel.id,
      target:
        parcel.courtCase?.caseNumber || parcel.courtCase?.id || "Court Case",
      description:
        "Shows available dispute or court information linked to the parcel.",
      icon: Scale,
    },
  ];

  return {
    nodes,
    edges,
    relationships,
  };
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function formatLabel(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}
