/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";
const VERIFICATION_DOCUMENTS = [
  { key: "fssaiCertificateFile", type: "fssai_certificate", label: "FSSAI Certificate" },
  { key: "kitchenCookingAreaPhoto", type: "kitchen_cooking_area_photo", label: "Kitchen Photo - Cooking Area" },
  { key: "kitchenPreparationAreaPhoto", type: "kitchen_preparation_area_photo", label: "Kitchen Photo - Preparation Area" },
  { key: "kitchenStorageAreaPhoto", type: "kitchen_storage_area_photo", label: "Kitchen Photo - Storage Area" },
  { key: "kitchenUtensilsCleaningAreaPhoto", type: "kitchen_utensils_cleaning_area_photo", label: "Kitchen Photo - Utensils/Cleaning Area" },
  { key: "staffHygienePhoto", type: "staff_hygiene_photo", label: "Staff hygiene photo" },
  { key: "storageFridgePhoto", type: "storage_fridge_photo", label: "Storage/Fridge photo" },
  { key: "packagingPhoto", type: "packaging_photo", label: "Packaging photo" },
  { key: "pestControlProofFile", type: "pest_control_proof", label: "Pest control proof" }
];
const VERIFICATION_SECTIONS = [
  { id: "basic_business", label: "Basic Business Details", description: "Contact number and restaurant address." },
  { id: "legal_compliance", label: "Legal and Compliance", description: "GSTN, FSSAI number, expiry, and certificate upload." },
  { id: "kitchen_proof", label: "Kitchen Proof", description: "Mandatory kitchen proof images for all key areas." },
  { id: "staff_hygiene", label: "Staff Hygiene", description: "Protective gear confirmation and optional staff photo." },
  { id: "food_handling", label: "Food Handling and Storage", description: "Storage separation, fridge proof, and temperature confirmation." },
  { id: "packaging_safety", label: "Packaging Safety", description: "Packaging type, packaging photo, and tamper-safe confirmation." },
  { id: "pest_control", label: "Pest Control and Cleanliness", description: "Pest control date, proof, and waste disposal method." },
  { id: "water_safety", label: "Water and Ingredient Safety", description: "Water source and clean-water confirmation." },
  { id: "self_declaration", label: "Self Declaration", description: "Final declaration confirming food safety standards." }
];
const SECTION_DOCUMENT_KEYS = {
  legal_compliance: ["fssaiCertificateFile"],
  kitchen_proof: [
    "kitchenCookingAreaPhoto",
    "kitchenPreparationAreaPhoto",
    "kitchenStorageAreaPhoto",
    "kitchenUtensilsCleaningAreaPhoto"
  ],
  staff_hygiene: ["staffHygienePhoto"],
  food_handling: ["storageFridgePhoto"],
  packaging_safety: ["packagingPhoto"],
  pest_control: ["pestControlProofFile"]
};
const APPROVAL_SECTION_DEFINITIONS = [
  {
    id: "basic_business",
    title: "Basic business details",
    items: [
      { kind: "text", field: "contactNumber", label: "Contact number" },
      { kind: "text", field: "restaurantAddress", label: "Restaurant address" }
    ]
  },
  {
    id: "legal_compliance",
    title: "Legal and compliance",
    items: [
      { kind: "text", field: "gstnNumber", label: "GSTN number" },
      { kind: "text", field: "fssaiLicenseNumber", label: "FSSAI license number" },
      { kind: "date", field: "fssaiExpiryDate", label: "FSSAI expiry date" },
      { kind: "document", type: "fssai_certificate", label: "FSSAI certificate" }
    ]
  },
  {
    id: "kitchen_proof",
    title: "Kitchen proof",
    items: [
      { kind: "document", type: "kitchen_cooking_area_photo", label: "Cooking area photo" },
      { kind: "document", type: "kitchen_preparation_area_photo", label: "Preparation area photo" },
      { kind: "document", type: "kitchen_storage_area_photo", label: "Storage area photo" },
      { kind: "document", type: "kitchen_utensils_cleaning_area_photo", label: "Utensils and cleaning area photo" }
    ]
  },
  {
    id: "staff_hygiene",
    title: "Staff hygiene",
    items: [
      { kind: "boolean", field: "staffUsesProtectiveGear", label: "Protective gear confirmation", passText: "Confirmed", failText: "Not confirmed" },
      { kind: "document", type: "staff_hygiene_photo", label: "Staff hygiene photo" }
    ]
  },
  {
    id: "food_handling",
    title: "Food handling and storage",
    items: [
      { kind: "boolean", field: "rawAndCookedStoredSeparately", label: "Raw and cooked food stored separately", passText: "Confirmed", failText: "Not confirmed" },
      { kind: "boolean", field: "temperatureMaintainedProperly", label: "Temperature maintained properly", passText: "Confirmed", failText: "Not confirmed" },
      { kind: "document", type: "storage_fridge_photo", label: "Storage or fridge photo" }
    ]
  },
  {
    id: "packaging_safety",
    title: "Packaging safety",
    items: [
      { kind: "text", field: "packagingType", label: "Packaging type" },
      { kind: "boolean", field: "sealedPackaging", label: "Tamper-safe packaging", passText: "Confirmed", failText: "Not confirmed" },
      { kind: "document", type: "packaging_photo", label: "Packaging photo" }
    ]
  },
  {
    id: "pest_control",
    title: "Pest control and cleanliness",
    items: [
      { kind: "date", field: "lastPestControlDate", label: "Last pest control date" },
      { kind: "document", type: "pest_control_proof", label: "Pest control proof" },
      { kind: "text", field: "wasteDisposalMethod", label: "Waste disposal method" }
    ]
  },
  {
    id: "water_safety",
    title: "Water and ingredient safety",
    items: [
      { kind: "text", field: "waterSource", label: "Water source" },
      { kind: "boolean", field: "cleanWaterUsedForCooking", label: "Clean water used for cooking", passText: "Confirmed", failText: "Not confirmed" }
    ]
  },
  {
    id: "self_declaration",
    title: "Self declaration",
    items: [
      { kind: "boolean", field: "selfDeclarationAccepted", label: "Safety declaration accepted", passText: "Accepted", failText: "Not accepted" }
    ]
  }
];
const SECTION_WORKFLOW_LABELS = {
  draft: "Not Submitted",
  pending: "Pending Review",
  rejected: "Rejected",
  approved: "Approved"
};
const createEmptySectionWorkflowStates = () =>
  VERIFICATION_SECTIONS.reduce((acc, section) => {
    acc[section.id] = {
      status: "draft",
      submittedAt: null,
      reviewedAt: null,
      lastUpdatedAt: null,
      adminRemarks: ""
    };
    return acc;
  }, {});
const normalizeSectionWorkflowStates = (states = {}) => {
  const next = createEmptySectionWorkflowStates();
  Object.keys(next).forEach((sectionId) => {
    const current = states?.[sectionId] || {};
    next[sectionId] = {
      ...next[sectionId],
      ...current,
      status: ["draft", "pending", "rejected", "approved"].includes(current.status) ? current.status : "draft"
    };
  });
  return next;
};

const emptyRestaurant = {
  id: "",
  name: "",
  ownerName: "",
  contactNumber: "",
  restaurantAddress: "",
  gstnNumber: "",
  fssaiLicenseNumber: "",
  fssaiExpiryDate: "",
  staffUsesProtectiveGear: false,
  rawAndCookedStoredSeparately: false,
  temperatureMaintainedProperly: false,
  packagingType: "",
  sealedPackaging: false,
  lastPestControlDate: "",
  wasteDisposalMethod: "",
  waterSource: "RO",
  cleanWaterUsedForCooking: false,
  selfDeclarationAccepted: false,
  kitchenVerificationStatus: "pending",
  lastInspectionDate: "",
  nextInspectionDate: "",
  packagingStatus: "unchecked",
  staffHygieneStatus: "unchecked",
  foodHandlingStatus: "unchecked",
  remarksByAdmin: "",
  verifiedBy: "admin"
};
const emptyDish = { name: "", description: "", price: "", image: null, prepTime: "25-35 min", tags: "", isBestseller: false, categoryMode: "existing", selectedCategory: "", newCategory: "" };
const emptyComplaintReview = { status: "in_review", resolutionNote: "", reviewedBy: "admin", triggeredReinspection: false };
const emptyVerificationFiles = {
  fssaiCertificateFile: null,
  kitchenCookingAreaPhoto: null,
  kitchenPreparationAreaPhoto: null,
  kitchenStorageAreaPhoto: null,
  kitchenUtensilsCleaningAreaPhoto: null,
  staffHygienePhoto: null,
  storageFridgePhoto: null,
  packagingPhoto: null,
  pestControlProofFile: null
};

const dateInput = (v) => (v ? String(v).slice(0, 10) : "");
const tagsToInput = (tags) => (Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : "");
const formatDisplayDate = (value) => {
  if (!value) return "Not available yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available yet";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};
const hasFieldValue = (value) => {
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  return String(value || "").trim().length > 0;
};

export default function RestPanel() {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState("safety");
  const [selectedVerificationSection, setSelectedVerificationSection] = useState("basic_business");
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [verificationFiles, setVerificationFiles] = useState(emptyVerificationFiles);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [complaintReview, setComplaintReview] = useState(emptyComplaintReview);
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [addForm, setAddForm] = useState(emptyDish);
  const [updateForm, setUpdateForm] = useState(emptyDish);
  const [editingDishId, setEditingDishId] = useState("");
  const [dishSearch, setDishSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isBootstrappingRestaurant, setIsBootstrappingRestaurant] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [isDishSaving, setIsDishSaving] = useState(false);
  const [isComplaintSaving, setIsComplaintSaving] = useState(false);
  const [isDeletingDish, setIsDeletingDish] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", title: "", message: "" });
  const [selectedRestaurantDetail, setSelectedRestaurantDetail] = useState(null);
  const [editingApprovalSectionId, setEditingApprovalSectionId] = useState("");
  const [approvalEditForm, setApprovalEditForm] = useState(emptyRestaurant);
  const [approvalEditFiles, setApprovalEditFiles] = useState(emptyVerificationFiles);
  const [isApprovalEditSaving, setIsApprovalEditSaving] = useState(false);
  const [addDishFormKey, setAddDishFormKey] = useState(0);

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });
  const logout = async () => {
    if (isSignedIn) {
      await signOut();
    }
    navigate("/login");
  };
  const selectedRestaurantSummary = restaurants.find((item) => item.id === selectedRestaurantId) || null;
  const selectedRestaurant = selectedRestaurantDetail || selectedRestaurantSummary;
  const displayRestaurantName =
    selectedRestaurant?.name ||
    restaurantForm.name ||
    String(user?.unsafeMetadata?.restaurantName || "").trim() ||
    "Restaurant";
  const displayOwnerName =
    restaurantForm.ownerName ||
    String(user?.unsafeMetadata?.ownerName || "").trim() ||
    selectedRestaurant?.ownerName ||
    selectedRestaurant?.ownerDisplayName ||
    "Owner";

  const fetchJson = async (url, options = {}) => {
    const clerkToken = isSignedIn ? await getToken() : null;
    const authHeaders = clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {};

    const res = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Request failed");
    return data;
  };

  const loadRestaurants = async (preferredId = "") => {
    const data = await fetchJson(`${API_BASE}/api/restaurants`);
    setRestaurants(data || []);
    const nextId = preferredId || selectedRestaurantId || data?.[0]?.id || "";
    if (nextId) setSelectedRestaurantId(nextId);
  };

  const loadRestaurantDetails = async (restaurantId) => {
    if (!restaurantId) return;
    const detail = await fetchJson(`${API_BASE}/api/restaurants/${restaurantId}`);
    setSelectedRestaurantDetail(detail);
    setRestaurantForm({
      id: detail.id || "",
      name: detail.name || "",
      ownerName: detail.ownerName || detail.ownerDisplayName || "",
      contactNumber: detail.contactNumber || "",
      restaurantAddress: detail.restaurantAddress || detail.location || "",
      gstnNumber: detail.gstnNumber || "",
      fssaiLicenseNumber: detail.fssaiLicenseNumber || "",
      fssaiExpiryDate: dateInput(detail.fssaiExpiryDate),
      staffUsesProtectiveGear: Boolean(detail.staffUsesProtectiveGear),
      rawAndCookedStoredSeparately: Boolean(detail.rawAndCookedStoredSeparately),
      temperatureMaintainedProperly: Boolean(detail.temperatureMaintainedProperly),
      packagingType: detail.packagingType || "",
      sealedPackaging: Boolean(detail.sealedPackaging),
      lastPestControlDate: dateInput(detail.lastPestControlDate),
      wasteDisposalMethod: detail.wasteDisposalMethod || "",
      waterSource: detail.waterSource || "RO",
      cleanWaterUsedForCooking: Boolean(detail.cleanWaterUsedForCooking),
      selfDeclarationAccepted: Boolean(detail.selfDeclarationAccepted),
      kitchenVerificationStatus: detail.kitchenVerificationStatus || "pending",
      lastInspectionDate: dateInput(detail.lastInspectionDate),
      nextInspectionDate: dateInput(detail.nextInspectionDate),
      packagingStatus: detail.packagingStatus || "unchecked",
      staffHygieneStatus: detail.staffHygieneStatus || "unchecked",
      foodHandlingStatus: detail.foodHandlingStatus || "unchecked",
      remarksByAdmin: detail.remarksByAdmin || "",
      verifiedBy: detail.verifiedBy || "admin"
    });
  };

  const loadComplaints = async () => {
    setComplaints(await fetchJson(`${API_BASE}/api/complaints`));
  };

  const loadDishes = async () => setDishes(await fetchJson(`${API_BASE}/api/dishes`));
  const loadCategories = async () => {
    const data = await fetchJson(`${API_BASE}/api/dishes/categories`);
    const nextCategories = (data || []).filter((item) => item && item !== "All");
    setCategories(nextCategories);
    return nextCategories;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    loadRestaurants().catch(() => {});
    loadComplaints().catch(() => {});
    loadDishes().catch(() => {});
    loadCategories().catch(() => {});
  }, [isLoaded, isSignedIn]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedRestaurantId) loadRestaurantDetails(selectedRestaurantId).catch(() => {}); }, [selectedRestaurantId]);
  useEffect(() => {
    if (!categories.length) return;
    setAddForm((prev) => ({ ...prev, selectedCategory: prev.selectedCategory || categories[0] }));
    setUpdateForm((prev) => ({ ...prev, selectedCategory: prev.selectedCategory || categories[0] }));
  }, [categories, selectedRestaurantId, restaurants]);
  useEffect(() => {
    if (categories.length) return;
    setAddForm((prev) => ({ ...prev, categoryMode: "new", selectedCategory: "" }));
  }, [categories.length]);
  const sectionWorkflowStates = useMemo(
    () => normalizeSectionWorkflowStates(selectedRestaurant?.verificationSections),
    [selectedRestaurant]
  );
  const availableSafetySections = useMemo(
    () => VERIFICATION_SECTIONS.filter((section) => sectionWorkflowStates[section.id]?.status === "draft"),
    [sectionWorkflowStates]
  );
  useEffect(() => {
    if (!availableSafetySections.length) return;
    if (availableSafetySections.some((section) => section.id === selectedVerificationSection)) return;
    setSelectedVerificationSection(availableSafetySections[0].id);
  }, [availableSafetySections, selectedVerificationSection]);
  const approvalDocuments = useMemo(() => {
    const map = new Map();
    (selectedRestaurant?.documents || []).forEach((doc) => {
      if (doc?.type && !map.has(doc.type)) {
        map.set(doc.type, doc);
      }
    });
    return map;
  }, [selectedRestaurant]);
  const approvalSections = useMemo(
    () =>
      APPROVAL_SECTION_DEFINITIONS.map((section) => {
        const workflow = sectionWorkflowStates[section.id] || { status: "draft" };
        const items = section.items.map((item) => {
          if (item.kind === "document") {
            const document = approvalDocuments.get(item.type);
            const passed = Boolean(document);
            const status =
              document?.reviewStatus === "approved"
                ? "passed"
                : document?.reviewStatus === "rejected"
                  ? "rejected"
                  : "pending";
            return {
              ...item,
              status,
              detail: passed
                ? document.reviewStatus === "rejected"
                  ? (document.adminRemarks || `Rejected on ${formatDisplayDate(document.reviewedAt)}`)
                  : document.reviewStatus === "approved"
                    ? `Approved ${formatDisplayDate(document.reviewedAt || document.createdAt)}`
                    : `Uploaded ${formatDisplayDate(document.createdAt)} and waiting for review`
                : "Awaiting upload",
              link: document?.fileUrl || "",
              adminRemarks: document?.adminRemarks || ""
            };
          }

          const value = restaurantForm[item.field];
          const passed = hasFieldValue(value);
          const status =
            workflow.status === "approved"
              ? "passed"
              : workflow.status === "rejected"
                ? "rejected"
                : workflow.status === "pending"
                  ? passed ? "passed" : "pending"
                  : "pending";
          let detail = "";

          if (item.kind === "boolean") {
            detail = passed ? (item.passText || "Confirmed") : (item.failText || "Not confirmed");
          } else if (item.kind === "date") {
            detail = passed ? formatDisplayDate(value) : status === "rejected" ? "Missing in the rejected review" : "Awaiting submission";
          } else {
            detail = passed ? String(value).trim() : status === "rejected" ? "Missing in the rejected review" : "Awaiting submission";
          }

          return {
            ...item,
            status,
            detail
          };
        });

        return {
          ...section,
          workflow,
          items,
          passedCount: items.filter((item) => item.status === "passed").length,
          rejectedCount: items.filter((item) => item.status === "rejected").length,
          pendingCount: items.filter((item) => item.status === "pending").length
        };
      }),
    [approvalDocuments, restaurantForm, sectionWorkflowStates]
  );
  const submittedApprovalSections = useMemo(
    () => approvalSections.filter((section) => section.workflow.status !== "draft"),
    [approvalSections]
  );
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (restaurants.length > 0) return;
    if (isBootstrappingRestaurant) return;

    const meta = user.unsafeMetadata || {};
    const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
    const restaurantName = String(meta.restaurantName || "").trim();

    if (!restaurantName) return;

    setIsBootstrappingRestaurant(true);

    fetchJson(`${API_BASE}/api/restaurants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: restaurantName,
        ownerName: String(meta.ownerName || "").trim(),
        gstnNumber: String(meta.gstnNumber || "").trim(),
        verifiedBy: String(meta.ownerName || primaryEmail || "restaurant_owner").trim(),
        ownerDisplayName: String(meta.ownerName || "").trim(),
        restaurantAddress: "",
        location: ""
      })
      })
      .then((data) => {
        showToast("success", "Restaurant profile created", `${data.name} is now linked to this account.`);
        return loadRestaurants(data.id);
      })
      .catch(() => {})
      .finally(() => setIsBootstrappingRestaurant(false));
  }, [isBootstrappingRestaurant, isLoaded, isSignedIn, restaurants.length, user]);

  const uploadVerificationDocuments = async (restaurantId, sectionId, files, setFiles) => {
    const allowedKeys = new Set(SECTION_DOCUMENT_KEYS[sectionId] || []);
    const uploads = VERIFICATION_DOCUMENTS.filter(({ key }) => allowedKeys.has(key) && files[key]);
    if (!uploads.length) return;

    for (const item of uploads) {
      const fd = new FormData();
      fd.append("type", item.type);
      fd.append("label", item.label);
      fd.append("file", files[item.key]);
      fd.append("uploadedBy", user?.primaryEmailAddress?.emailAddress || "restaurant_owner");
      fd.append("sectionId", sectionId);
      await fetchJson(`${API_BASE}/api/restaurants/${restaurantId}/documents`, { method: "POST", body: fd });
    }

    setFiles((prev) => {
      const next = { ...prev };
      uploads.forEach(({ key }) => {
        next[key] = null;
      });
      return next;
    });
  };
  const submitVerificationSection = async ({
    sectionId,
    formState,
    fileState,
    setFileState,
    setSavingState,
    successTitle,
    successMessage
  }) => {
    if (setSavingState) setSavingState(true);

    try {
      const data = await fetchJson(`${API_BASE}/api/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          location: formState.restaurantAddress,
          ownerDisplayName: formState.ownerName,
          submittedSectionId: sectionId
        })
      });
      await uploadVerificationDocuments(data.id, sectionId, fileState, setFileState);
      await loadRestaurants(data.id);
      await loadRestaurantDetails(data.id);
      await loadDishes();
      showToast("success", successTitle, successMessage(data.name));
      return true;
    } catch (err) {
      showToast("error", "Save failed", err.message);
      return false;
    } finally {
      if (setSavingState) setSavingState(false);
    }
  };
  const saveRestaurant = async (e) => {
    e.preventDefault();
    if (isSubmittingVerification) return;

    if (!restaurantForm.name.trim() && selectedVerificationSection !== "basic_business") {
      showToast("error", "Basic details first", "Please submit basic business details first.");
      return;
    }

    if (selectedVerificationSection === "self_declaration" && !restaurantForm.selfDeclarationAccepted) {
      showToast("error", "Declaration required", "Please confirm the self declaration before submitting.");
      return;
    }

    const sectionLabel = VERIFICATION_SECTIONS.find((item) => item.id === selectedVerificationSection)?.label || "Section";
    await submitVerificationSection({
      sectionId: selectedVerificationSection,
      formState: restaurantForm,
      fileState: verificationFiles,
      setFileState: setVerificationFiles,
      setSavingState: setIsSubmittingVerification,
      successTitle: "Section saved",
      successMessage: (restaurantName) => `${sectionLabel} submitted for ${restaurantName}.`
    });
  };
  const openApprovalSectionEditor = (sectionId) => {
    setEditingApprovalSectionId(sectionId);
    setApprovalEditForm({ ...restaurantForm });
    setApprovalEditFiles({ ...emptyVerificationFiles });
  };
  const closeApprovalSectionEditor = () => {
    setEditingApprovalSectionId("");
    setApprovalEditFiles({ ...emptyVerificationFiles });
  };
  const saveApprovalSectionUpdate = async (e) => {
    e.preventDefault();
    if (!editingApprovalSectionId || isApprovalEditSaving) return;

    if (!approvalEditForm.name.trim() && editingApprovalSectionId !== "basic_business") {
      showToast("error", "Basic details first", "Please submit basic business details first.");
      return;
    }

    if (editingApprovalSectionId === "self_declaration" && !approvalEditForm.selfDeclarationAccepted) {
      showToast("error", "Declaration required", "Please confirm the self declaration before submitting.");
      return;
    }

    const sectionLabel = VERIFICATION_SECTIONS.find((item) => item.id === editingApprovalSectionId)?.label || "Section";
    const saved = await submitVerificationSection({
      sectionId: editingApprovalSectionId,
      formState: approvalEditForm,
      fileState: approvalEditFiles,
      setFileState: setApprovalEditFiles,
      setSavingState: setIsApprovalEditSaving,
      successTitle: "Section updated",
      successMessage: () => `${sectionLabel} sent back for review.`
    });

    if (saved) {
      setApprovalEditForm(emptyRestaurant);
      closeApprovalSectionEditor();
    }
  };

  const buildDishFormData = (form, category) => {
    const fd = new FormData();
    [["name", form.name.trim()], ["description", form.description], ["price", form.price], ["category", category], ["prepTime", form.prepTime], ["tags", form.tags], ["isBestseller", String(form.isBestseller)], ["restaurantId", selectedRestaurantId || ""]].forEach(([k, v]) => fd.append(k, v));
    if (form.image) fd.append("image", form.image);
    return fd;
  };

  const saveDish = async (e, mode) => {
    e.preventDefault();
    if (isDishSaving) return;
    const form = mode === "add" ? addForm : updateForm;
    const category = form.categoryMode === "new" ? form.newCategory.trim() : form.selectedCategory.trim();
    if (!form.name.trim() || !form.price || !category) return showToast("error", "Missing fields", "Name, price and category are required.");
    if (mode === "add" && !form.image) return showToast("error", "Image required", "Please upload an image.");
    try {
      setIsDishSaving(true);
      const url = mode === "add" ? `${API_BASE}/api/dishes` : `${API_BASE}/api/dishes/${editingDishId}`;
      const method = mode === "add" ? "POST" : "PUT";
      const data = await fetchJson(url, { method, body: buildDishFormData(form, category) });
      showToast("success", mode === "add" ? "Dish added" : "Dish updated", `${data.name} saved.`);
      await loadDishes();
      const refreshedCategories = await loadCategories();
      if (mode === "add") {
        setAddForm({
          ...emptyDish,
          categoryMode: refreshedCategories.length ? "existing" : "new",
          selectedCategory: "",
          newCategory: ""
        });
        setAddDishFormKey((current) => current + 1);
      }
      if (mode === "update") setEditingDishId(data.id);
    } catch (err) { showToast("error", "Dish save failed", err.message); }
    finally { setIsDishSaving(false); }
  };

  const selectDish = (dish) => {
    const category = (dish.category || "").trim();
    const useExisting = categories.includes(category);
    setEditingDishId(dish.id || dish._id);
    setUpdateForm({ name: dish.name || "", description: dish.description || "", price: dish.price ?? "", image: null, prepTime: dish.prepTime || "25-35 min", tags: tagsToInput(dish.tags), isBestseller: Boolean(dish.isBestseller), categoryMode: useExisting ? "existing" : "new", selectedCategory: useExisting ? category : categories[0] || "", newCategory: useExisting ? "" : category });
    setActiveTab("update");
  };

    const reviewComplaint = async (e) => {
    e.preventDefault();
    if (isComplaintSaving) return;
    try {
      setIsComplaintSaving(true);
      await fetchJson(`${API_BASE}/api/complaints/${selectedComplaintId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(complaintReview) });
      showToast("success", "Complaint updated", "Review saved.");
      setSelectedComplaintId("");
      setComplaintReview(emptyComplaintReview);
      await loadComplaints();
      if (selectedRestaurantId) { await loadRestaurants(selectedRestaurantId); await loadRestaurantDetails(selectedRestaurantId); }
    } catch (err) { showToast("error", "Complaint update failed", err.message); }
    finally { setIsComplaintSaving(false); }
  };

  const deleteDish = async () => {
    if (isDeletingDish || !deleteTarget) return;
    try {
      setIsDeletingDish(true);
      await fetchJson(`${API_BASE}/api/dishes/${deleteTarget.id || deleteTarget._id}`, { method: "DELETE" });
      showToast("success", "Dish deleted", `${deleteTarget.name} removed.`);
      setDeleteTarget(null);
      await loadDishes();
    } catch (err) { showToast("error", "Delete failed", err.message); }
    finally { setIsDeletingDish(false); }
  };

  const filteredDishes = dishes.filter((dish) => {
    const q = dishSearch.trim().toLowerCase();
    return !q || (dish.name || "").toLowerCase().includes(q) || (dish.category || "").toLowerCase().includes(q);
  });
  const renderVerificationSectionFields = (sectionId, formState, setFormState, setFileState) => {
    if (sectionId === "basic_business") {
      return [
        ["contactNumber", "Contact Number"],
        ["restaurantAddress", "Restaurant Address"]
      ].map(([field, label]) => (
        <label key={field} className={`admin-field ${field === "restaurantAddress" ? "admin-field-full" : ""}`}>
          <span>{label}</span>
          {field === "restaurantAddress" ? (
            <textarea rows={3} value={formState[field]} onChange={(e) => setFormState((p) => ({ ...p, [field]: e.target.value }))} />
          ) : (
            <input value={formState[field]} onChange={(e) => setFormState((p) => ({ ...p, [field]: e.target.value }))} />
          )}
        </label>
      ));
    }

    if (sectionId === "legal_compliance") {
      return <>
        <label className="admin-field"><span>GSTN Number</span><input value={formState.gstnNumber} onChange={(e) => setFormState((p) => ({ ...p, gstnNumber: e.target.value }))} /></label>
        <label className="admin-field"><span>FSSAI License Number</span><input value={formState.fssaiLicenseNumber} onChange={(e) => setFormState((p) => ({ ...p, fssaiLicenseNumber: e.target.value }))} /></label>
        <label className="admin-field"><span>FSSAI expiry date</span><input type="date" value={formState.fssaiExpiryDate} onChange={(e) => setFormState((p) => ({ ...p, fssaiExpiryDate: e.target.value }))} /></label>
        <label className="admin-field admin-field-full"><span>FSSAI Certificate</span><input type="file" accept="image/*,.pdf" onChange={(e) => setFileState((p) => ({ ...p, fssaiCertificateFile: e.target.files?.[0] || null }))} /></label>
      </>;
    }

    if (sectionId === "kitchen_proof") {
      return <>
        <label className="admin-field"><span>Kitchen Photo - Cooking Area</span><input type="file" accept="image/*" onChange={(e) => setFileState((p) => ({ ...p, kitchenCookingAreaPhoto: e.target.files?.[0] || null }))} /></label>
        <label className="admin-field"><span>Kitchen Photo - Preparation Area</span><input type="file" accept="image/*" onChange={(e) => setFileState((p) => ({ ...p, kitchenPreparationAreaPhoto: e.target.files?.[0] || null }))} /></label>
        <label className="admin-field"><span>Kitchen Photo - Storage Area</span><input type="file" accept="image/*" onChange={(e) => setFileState((p) => ({ ...p, kitchenStorageAreaPhoto: e.target.files?.[0] || null }))} /></label>
        <label className="admin-field"><span>Kitchen Photo - Utensils/Cleaning Area</span><input type="file" accept="image/*" onChange={(e) => setFileState((p) => ({ ...p, kitchenUtensilsCleaningAreaPhoto: e.target.files?.[0] || null }))} /></label>
      </>;
    }

    if (sectionId === "staff_hygiene") {
      return <>
        <label className="admin-field"><span>Staff uses gloves, caps, aprons</span><select value={formState.staffUsesProtectiveGear ? "yes" : "no"} onChange={(e) => setFormState((p) => ({ ...p, staffUsesProtectiveGear: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="admin-field"><span>Staff hygiene photo</span><input type="file" accept="image/*" onChange={(e) => setFileState((p) => ({ ...p, staffHygienePhoto: e.target.files?.[0] || null }))} /></label>
      </>;
    }

    if (sectionId === "food_handling") {
      return <>
        <label className="admin-field"><span>Raw and cooked food stored separately</span><select value={formState.rawAndCookedStoredSeparately ? "yes" : "no"} onChange={(e) => setFormState((p) => ({ ...p, rawAndCookedStoredSeparately: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="admin-field"><span>Temperature maintained properly</span><select value={formState.temperatureMaintainedProperly ? "yes" : "no"} onChange={(e) => setFormState((p) => ({ ...p, temperatureMaintainedProperly: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="admin-field admin-field-full"><span>Storage/Fridge photo</span><input type="file" accept="image/*" onChange={(e) => setFileState((p) => ({ ...p, storageFridgePhoto: e.target.files?.[0] || null }))} /></label>
      </>;
    }

    if (sectionId === "packaging_safety") {
      return <>
        <label className="admin-field"><span>Type of packaging used</span><input value={formState.packagingType} onChange={(e) => setFormState((p) => ({ ...p, packagingType: e.target.value }))} /></label>
        <label className="admin-field"><span>Sealed / tamper-safe packaging</span><select value={formState.sealedPackaging ? "yes" : "no"} onChange={(e) => setFormState((p) => ({ ...p, sealedPackaging: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="admin-field admin-field-full"><span>Packaging photo</span><input type="file" accept="image/*" onChange={(e) => setFileState((p) => ({ ...p, packagingPhoto: e.target.files?.[0] || null }))} /></label>
      </>;
    }

    if (sectionId === "pest_control") {
      return <>
        <label className="admin-field"><span>Last pest control date</span><input type="date" value={formState.lastPestControlDate} onChange={(e) => setFormState((p) => ({ ...p, lastPestControlDate: e.target.value }))} /></label>
        <label className="admin-field"><span>Pest control proof</span><input type="file" accept="image/*,.pdf" onChange={(e) => setFileState((p) => ({ ...p, pestControlProofFile: e.target.files?.[0] || null }))} /></label>
        <label className="admin-field admin-field-full"><span>Waste disposal method</span><textarea rows={3} value={formState.wasteDisposalMethod} onChange={(e) => setFormState((p) => ({ ...p, wasteDisposalMethod: e.target.value }))} /></label>
      </>;
    }

    if (sectionId === "water_safety") {
      return <>
        <label className="admin-field"><span>Water source</span><select value={formState.waterSource} onChange={(e) => setFormState((p) => ({ ...p, waterSource: e.target.value }))}><option value="RO">RO</option><option value="Filtered">Filtered</option><option value="Municipal">Municipal</option></select></label>
        <label className="admin-field"><span>Clean water used for cooking</span><select value={formState.cleanWaterUsedForCooking ? "yes" : "no"} onChange={(e) => setFormState((p) => ({ ...p, cleanWaterUsedForCooking: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
      </>;
    }

    if (sectionId === "self_declaration") {
      return <label className="admin-checkbox"><input type="checkbox" checked={formState.selfDeclarationAccepted} onChange={(e) => setFormState((p) => ({ ...p, selfDeclarationAccepted: e.target.checked }))} /><span>I confirm that all provided information is true and the kitchen follows food safety standards.</span></label>;
    }

    return null;
  };

  return (
    <div className="admin-panel-page">
      <div className="container admin-panel-shell">
        <header className="admin-panel-header"><div><div className="admin-badge">KK Control</div><div className="admin-panel-subheading">Restaurant safety and operations control</div><div className="admin-panel-identity"><div className="admin-panel-identity-item"><span>Restaurant</span><strong>{displayRestaurantName}</strong></div><div className="admin-panel-identity-divider" aria-hidden="true" /><div className="admin-panel-identity-item"><span>Owner</span><strong>{displayOwnerName}</strong></div></div></div><div className="admin-panel-actions"><button className="btn btn-primary" onClick={() => window.open("https://khanna-khazana-4.onrender.com", "_blank", "noopener,noreferrer")}>Delivery portal</button><button className="btn admin-secondary-button" onClick={logout}>Logout</button></div></header>
        <section className="admin-panel-body">
          <aside className="admin-side-panel">{[["safety", "Restaurant Safety"], ["approval", "Approval Status"], ["complaints", "Complaints"], ["add", "Add Dish"], ["update", "Update Dish"], ["remove", "Remove Dish"]].map(([key, label]) => <button key={key} type="button" className={`admin-tab-button ${activeTab === key ? "is-active" : ""}`} onClick={() => setActiveTab(key)}>{label}</button>)}</aside>
          <div className="admin-content-panel">
            {activeTab === "approval" ? (
              <div className="admin-approval-view">
                <section className="admin-panel-block admin-owner-approval-block">
                  <div className="admin-form-header admin-owner-approval-header">
                    <h2>Submitted headings</h2>
                    <p>Only submitted headings are shown here. Rejected headings can be updated from this tab.</p>
                  </div>
                  <div className="admin-approval-section-list">
                    {submittedApprovalSections.map((section) => (
                      <article key={section.id} className={`admin-approval-section-card admin-owner-approval-card admin-owner-approval-card-${section.workflow.status}`}>
                        <div className="admin-approval-section-head">
                          <div>
                            <strong>{section.title}</strong>
                            <span className="admin-owner-approval-pill">{SECTION_WORKFLOW_LABELS[section.workflow.status] || "Pending Review"}</span>
                          </div>
                          {section.workflow.status === "rejected" ? <button type="button" className="btn admin-secondary-button" onClick={() => openApprovalSectionEditor(section.id)}>Update</button> : null}
                        </div>
                        {section.workflow.adminRemarks ? <div className="admin-section-remarks">Admin note: {section.workflow.adminRemarks}</div> : null}
                      </article>
                    ))}
                    {!submittedApprovalSections.length ? <div className="admin-empty-state admin-owner-approval-empty">Submitted headings will appear here after you send them for review.</div> : null}
                  </div>
                </section>
              </div>
            ) : null}
            {activeTab === "safety" ? (
              <div className="admin-remove-shell">
                <>
                <div className="admin-form-header"><h2>Restaurant verification submission</h2><p>Submit only the required restaurant verification details, compliance proof, and kitchen safety uploads.</p></div>
                <div className="admin-form admin-grid-form">
                  <div className="admin-form-header">
                    <h2>Choose submission heading</h2>
                    <p>Only headings that have not been submitted yet appear here. Rejected headings can be updated from Approval Status.</p>
                  </div>
                  <label className="admin-field admin-field-full">
                    <span>Submission heading</span>
                    <select value={selectedVerificationSection} onChange={(e) => setSelectedVerificationSection(e.target.value)} disabled={!availableSafetySections.length}>
                      {availableSafetySections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
                    </select>
                  </label>
                </div>
                {availableSafetySections.length ? <form onSubmit={saveRestaurant} className="admin-form admin-grid-form">
                  <div className="admin-form-header"><h2>{VERIFICATION_SECTIONS.find((section) => section.id === selectedVerificationSection)?.label}</h2><p>{VERIFICATION_SECTIONS.find((section) => section.id === selectedVerificationSection)?.description}</p></div>
                  {renderVerificationSectionFields(selectedVerificationSection, restaurantForm, setRestaurantForm, setVerificationFiles)}
                  <button className={`btn btn-primary admin-button-full ${isSubmittingVerification ? "is-loading" : ""}`} disabled={isSubmittingVerification}>
                    {isSubmittingVerification ? "Sending details..." : `Submit ${VERIFICATION_SECTIONS.find((section) => section.id === selectedVerificationSection)?.label}`}
                  </button>
                </form> : <div className="admin-empty-state">All headings have already been submitted. Review updates from the Approval Status tab.</div>}
                </>
              </div>
            ) : null}
            {activeTab === "complaints" ? (
              <div className="admin-remove-shell">
                <div className="admin-form-header"><h2>Complaint review</h2><p>Review hygiene complaints and trigger reinspection when needed.</p></div>
                <div className="admin-complaint-list">{complaints.map((item) => <button key={item.id} type="button" className={`admin-complaint-card ${selectedComplaintId === item.id ? "is-selected" : ""}`} onClick={() => { setSelectedComplaintId(item.id); setComplaintReview({ status: item.status || "in_review", resolutionNote: item.resolutionNote || "", reviewedBy: "admin", triggeredReinspection: Boolean(item.triggeredReinspection) }); }}><strong>{item.complaintType.replaceAll("_", " ")}</strong><span>{item.restaurant?.name || "Unknown restaurant"}</span><small>{item.status.replaceAll("_", " ")}</small></button>)}</div>
                {selectedComplaintId ? <form onSubmit={reviewComplaint} className="admin-form admin-grid-form"><label className="admin-field"><span>Status</span><select value={complaintReview.status} onChange={(e) => setComplaintReview((p) => ({ ...p, status: e.target.value }))}>{["open", "in_review", "resolved", "reinspection_triggered", "rejected"].map((v) => <option key={v} value={v}>{v}</option>)}</select></label><label className="admin-field"><span>Reviewed by</span><input value={complaintReview.reviewedBy} onChange={(e) => setComplaintReview((p) => ({ ...p, reviewedBy: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>Resolution note</span><textarea rows={4} value={complaintReview.resolutionNote} onChange={(e) => setComplaintReview((p) => ({ ...p, resolutionNote: e.target.value }))} /></label><label className="admin-checkbox"><input type="checkbox" checked={complaintReview.triggeredReinspection} onChange={(e) => setComplaintReview((p) => ({ ...p, triggeredReinspection: e.target.checked }))} /><span>Trigger reinspection</span></label><button className={`btn btn-primary admin-button-full ${isComplaintSaving ? "is-loading" : ""}`} disabled={isComplaintSaving}>{isComplaintSaving ? "Saving review..." : "Save review"}</button></form> : <div className="admin-empty-state">Select a complaint to review it.</div>}
              </div>
            ) : null}
            {["add", "update", "remove"].includes(activeTab) ? (
              <div className="admin-remove-shell">
                <div className="admin-form-header"><h2>{activeTab === "add" ? "Add dish" : activeTab === "update" ? "Update dishes" : "Remove dishes"}</h2><p>Dishes are linked automatically to the restaurant account that is currently logged in.</p></div>
                {activeTab !== "add" ? <div className="admin-search-row"><input className="admin-search-input" value={dishSearch} onChange={(e) => setDishSearch(e.target.value)} placeholder="Search by name or category" /><button className="btn admin-secondary-button" onClick={() => loadDishes().catch(() => {})}>Refresh</button></div> : null}
                {activeTab === "add" || editingDishId ? <form key={activeTab === "add" ? addDishFormKey : editingDishId} onSubmit={(e) => saveDish(e, activeTab === "add" ? "add" : "update")} className="admin-form admin-grid-form"><label className="admin-field admin-field-full"><span>Dish name</span><input value={(activeTab === "add" ? addForm : updateForm).name} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, name: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>Description</span><textarea rows={4} value={(activeTab === "add" ? addForm : updateForm).description} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, description: e.target.value }))} /></label><label className="admin-field"><span>Price</span><input type="number" value={(activeTab === "add" ? addForm : updateForm).price} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, price: e.target.value }))} /></label><label className="admin-field"><span>Restaurant</span><input value={displayRestaurantName} disabled /></label><label className="admin-field"><span>Category mode</span><select value={(activeTab === "add" ? addForm : updateForm).categoryMode} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, categoryMode: e.target.value }))}><option value="existing" disabled={!categories.length}>existing</option><option value="new">new</option></select></label>{((activeTab === "add" ? addForm : updateForm).categoryMode === "existing") ? <label className="admin-field"><span>Category</span><select value={(activeTab === "add" ? addForm : updateForm).selectedCategory} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, selectedCategory: e.target.value }))} disabled={!categories.length}><option value="">{categories.length ? "Select existing category" : "No existing categories yet"}</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label> : <label className="admin-field"><span>New category</span><input value={(activeTab === "add" ? addForm : updateForm).newCategory} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, newCategory: e.target.value }))} /></label>}<label className="admin-field"><span>Prep time</span><input value={(activeTab === "add" ? addForm : updateForm).prepTime} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, prepTime: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>Tags</span><input value={(activeTab === "add" ? addForm : updateForm).tags} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, tags: e.target.value }))} /></label><label className="admin-checkbox"><input type="checkbox" checked={(activeTab === "add" ? addForm : updateForm).isBestseller} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, isBestseller: e.target.checked }))} /><span>Highlight as bestseller</span></label><label className="admin-field admin-field-full"><span>{activeTab === "add" ? "Dish image" : "Replace dish image"}</span><input type="file" accept="image/*" onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, image: e.target.files?.[0] || null }))} /></label><button className={`btn btn-primary admin-button-full ${isDishSaving ? "is-loading" : ""}`} disabled={isDishSaving}>{isDishSaving ? (activeTab === "add" ? "Saving dish..." : "Updating dish...") : (activeTab === "add" ? "Save dish" : "Update dish")}</button></form> : <div className="admin-empty-state">Pick a dish below to edit it.</div>}
                {activeTab !== "add" ? <div className="admin-dish-list">{filteredDishes.map((dish) => <div key={dish.id || dish._id} className={`admin-dish-row ${editingDishId === (dish.id || dish._id) ? "is-selected" : ""}`}><div><div className="admin-dish-name">{dish.name}</div><div className="admin-dish-meta">{dish.category} / Rs {dish.price} / {dish.restaurant?.name || "No restaurant"}</div></div>{activeTab === "remove" ? <button type="button" className="btn admin-danger-button" onClick={() => setDeleteTarget(dish)}>Delete</button> : <button type="button" className="btn admin-secondary-button" onClick={() => selectDish(dish)}>Edit</button>}</div>)}</div> : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
      <Toast open={toast.open} type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      {editingApprovalSectionId ? <div className="confirm-dialog-backdrop" role="presentation"><div className="confirm-dialog-card admin-section-modal" role="dialog" aria-modal="true"><div className="confirm-dialog-badge">Update rejected heading</div><h3 className="confirm-dialog-title">{VERIFICATION_SECTIONS.find((section) => section.id === editingApprovalSectionId)?.label}</h3><p className="confirm-dialog-text">Update this rejected heading here and send it back for review.</p><form onSubmit={saveApprovalSectionUpdate} className="admin-form admin-grid-form">{renderVerificationSectionFields(editingApprovalSectionId, approvalEditForm, setApprovalEditForm, setApprovalEditFiles)}<div className="confirm-dialog-actions"><button type="button" className="btn admin-secondary-button" onClick={closeApprovalSectionEditor}>Cancel</button><button type="submit" className={`btn btn-primary ${isApprovalEditSaving ? "is-loading" : ""}`} disabled={isApprovalEditSaving}>{isApprovalEditSaving ? "Updating..." : "Update"}</button></div></form></div></div> : null}
      {deleteTarget ? <div className="confirm-dialog-backdrop" role="presentation"><div className="confirm-dialog-card" role="dialog" aria-modal="true"><div className="confirm-dialog-badge">Delete dish</div><h3 className="confirm-dialog-title">Confirm deletion</h3><p className="confirm-dialog-text">Delete <strong>{deleteTarget.name}</strong> from the live menu?</p><div className="confirm-dialog-actions"><button type="button" className="btn admin-secondary-button" disabled={isDeletingDish} onClick={() => setDeleteTarget(null)}>No</button><button type="button" className={`btn admin-danger-button ${isDeletingDish ? "is-loading" : ""}`} disabled={isDeletingDish} onClick={deleteDish}>{isDeletingDish ? "Deleting..." : "Yes, delete"}</button></div></div></div> : null}
    </div>
  );
}
