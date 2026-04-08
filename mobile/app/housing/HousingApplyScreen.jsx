import React, { useState, useEffect } from "react"
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
  Switch, Modal, FlatList, Alert
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import * as DocumentPicker from "expo-document-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { auth } from "../../config/firebase"
import BACKEND_URL from "../../config/backend"

const COLORS = {
  PRIMARY: "#1A237E",
  TEXT: "#334155",
  BG: "#F8FAFC",
  WHITE: "#FFFFFF",
  BORDER: "#E2E8F0",
  ACCENT: "#EF4444",
  SUCCESS: "#10B981",
  DISABLED: "#94A3B8"
}

export default function HousingApplyScreen() {
  const router = useRouter()
  const { initialData } = useLocalSearchParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)

  const [modal, setModal] = useState({ visible: false, type: "", data: [] })
  const [options, setOptions] = useState({
    faculties: [], levels: [], departments: [], governorates: {},
    genders: ["male", "female"], religions: ["Muslim", "Christian"],
    housingTypes: ["Normal", "Distinguished"], studentTypes: ["New Student", "Returning"],
    nationalities: ["Egyptian", "Other"]
  })

  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    nationality: "Egyptian",
    studentType: "New Student",
    shuonId: "",
    gender: "",
    religion: "",
    dateOfBirth: "",
    placeOfBirth: "",
    college: "",
    academicYear: "",
    residenceAddress: "",
    detailedAddress: "",
    mobile: "",
    phone: "",
    fatherName: "",
    fatherNationalId: "",
    fatherJob: "",
    fatherPhone: "",
    fatherAddress: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    parentsStatus: "",
    lastYearGrade: "",
    gradePercentage: "",
    previousHousing: false,
    housingType: "Normal",
    hasSpecialNeeds: false,
    hasMedicalCondition: false,
    familyAbroad: false
  })

  const [files, setFiles] = useState({
    documentUrl: null,
    medicalReport: null
  })

  useEffect(() => {
    const init = async () => {
      await loadOptions();
      if (initialData) {
        try {
          const data = JSON.parse(initialData);
          setFormData({
            fullName: data.fullName || "",
            nationalId: data.nationalId || "",
            nationality: data.nationality || "Egyptian",
            studentType: data.studentType || "New Student",
            shuonId: data.shuonId || "",
            gender: data.gender || "",
            religion: data.religion || "",
            dateOfBirth: data.dateOfBirth || "",
            placeOfBirth: data.placeOfBirth || "",
            college: data.college || "",
            academicYear: data.academicYear || "",
            residenceAddress: data.residenceAddress || "",
            detailedAddress: data.detailedAddress || "",
            mobile: data.mobile || "",
            phone: data.phone || "",
            fatherName: data.fatherName || "",
            fatherNationalId: data.fatherNationalId || "",
            fatherJob: data.fatherJob || "",
            fatherPhone: data.fatherPhone || "",
            fatherAddress: data.fatherAddress || "",
            guardianName: data.guardianName || "",
            guardianRelation: data.guardianRelation || "",
            guardianPhone: data.guardianPhone || "",
            parentsStatus: data.parentsStatus || "",
            lastYearGrade: data.lastYearGrade || "",
            gradePercentage: data.gradePercentage?.toString() || "",
            previousHousing: !!data.previousHousing,
            housingType: data.housingType || "Normal",
            hasSpecialNeeds: !!data.hasSpecialNeeds,
            hasMedicalCondition: !!data.hasMedicalCondition,
            familyAbroad: !!data.familyAbroad
          });

          if (data.documentUrl) {
            setFiles(prev => ({ ...prev, documentUrl: { name: "Existing Document.pdf", uri: data.documentUrl, existing: true } }));
          }
          if (data.medicalReport) {
            setFiles(prev => ({ ...prev, medicalReport: { name: "Existing Medical Report.pdf", uri: data.medicalReport, existing: true } }));
          }
        } catch (e) {
          console.log(e);
        }
      }
    };
    init();
  }, [initialData]);

  const loadOptions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/applications/options`)
      const data = await res.json()
      if (res.ok) {
        setOptions(prev => ({ ...prev, ...data }))
      }
    } catch (e) { console.log(e) }
    setFetching(false)
  }

  const updateField = (k, v) => setFormData(prev => ({ ...prev, [k]: v }))

  const pickFile = async (key) => {
    let res = await DocumentPicker.getDocumentAsync({ type: "application/pdf" })
    if (!res.canceled) {
      setFiles(prev => ({ ...prev, [key]: res.assets[0] }))
    }
  }

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }

  const submit = async () => {
    const isEdit = !!initialData;
    if (!isEdit && !files.documentUrl) {
      Alert.alert("Error", "Please upload the required PDF document.");
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const body = new FormData();

      Object.keys(formData).forEach(k => {
        const value = k === 'gradePercentage' ? (parseFloat(formData[k]) || 0) : formData[k];
        body.append(k, String(value));
      });

      if (files.documentUrl && !files.documentUrl.existing) {
        body.append("documentUrl", {
          uri: files.documentUrl.uri,
          name: files.documentUrl.name || "application.pdf",
          type: "application/pdf"
        });
      }

      if (files.medicalReport && !files.medicalReport.existing) {
        body.append("medicalReport", {
          uri: files.medicalReport.uri,
          name: files.medicalReport.name || "medical.pdf",
          type: "application/pdf"
        });
      }

      const appId = isEdit ? JSON.parse(initialData)._id : null;
      const url = isEdit ? `${BACKEND_URL}/api/applications/${appId}` : `${BACKEND_URL}/api/applications`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: body
      });

      const result = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Application processed successfully");
        router.back();
      } else {
        Alert.alert("Error", result.message || "Operation failed");
      }
    } catch (e) {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{initialData ? "Update Application" : "Housing Application"}</Text>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step {currentStep} of 6</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 6) * 100}%` }]} />
          </View>
        </View>

        {currentStep === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Identification</Text>
            <Select label="Student Type" value={formData.studentType} onPress={() => setModal({ visible: true, type: "studentType", data: options.studentTypes })} />
            <Input label="Full Name" value={formData.fullName} onChangeText={v => updateField("fullName", v)} />
            <Row>
              <Input label="National ID" value={formData.nationalId} onChangeText={v => updateField("nationalId", v)} containerStyle={{ flex: 1 }} />
              <Select label="Nationality" value={formData.nationality} onPress={() => setModal({ visible: true, type: "nationality", data: options.nationalities })} containerStyle={{ flex: 1 }} />
            </Row>
            <Input label="Student Affairs ID" value={formData.shuonId} onChangeText={v => updateField("shuonId", v)} />
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Personal Details</Text>
            <Row>
              <Select label="Gender" value={formData.gender} onPress={() => setModal({ visible: true, type: "gender", data: options.genders })} />
              <Select label="Religion" value={formData.religion} onPress={() => setModal({ visible: true, type: "religion", data: options.religions })} />
            </Row>
            <Input label="Birth Date (YYYY-MM-DD)" value={formData.dateOfBirth} onChangeText={v => updateField("dateOfBirth", v)} />
            <Input label="Birth Place" value={formData.placeOfBirth} onChangeText={v => updateField("placeOfBirth", v)} />
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Academic Information</Text>
            <Input label="College" value={formData.college} onChangeText={v => updateField("college", v)} />
            <Input label="Academic Year" value={formData.academicYear} onChangeText={v => updateField("academicYear", v)} />
            <Input label="Last Year Grade" value={formData.lastYearGrade} onChangeText={v => updateField("lastYearGrade", v)} />
            <Input label="Grade Percentage" keyboardType="numeric" value={formData.gradePercentage} onChangeText={v => updateField("gradePercentage", v)} />
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Contact & Residence</Text>
            <Input label="Mobile" value={formData.mobile} onChangeText={v => updateField("mobile", v)} />
            <Input label="Residence Address" value={formData.residenceAddress} onChangeText={v => updateField("residenceAddress", v)} />
            <Input label="Detailed Address" value={formData.detailedAddress} onChangeText={v => updateField("detailedAddress", v)} />
          </View>
        )}

        {currentStep === 5 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Family Information</Text>
            <Input label="Father Name" value={formData.fatherName} onChangeText={v => updateField("fatherName", v)} />
            <Input label="Father National ID" value={formData.fatherNationalId} onChangeText={v => updateField("fatherNationalId", v)} />
            <Input label="Father Job" value={formData.fatherJob} onChangeText={v => updateField("fatherJob", v)} />
            <Input label="Father Phone" value={formData.fatherPhone} onChangeText={v => updateField("fatherPhone", v)} />
          </View>
        )}

        {currentStep === 6 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Preferences & Documents</Text>
            <Select label="Housing Type" value={formData.housingType} onPress={() => setModal({ visible: true, type: "housingType", data: options.housingTypes })} />
            <Toggle label="Previous Housing" value={formData.previousHousing} onChange={v => updateField("previousHousing", v)} />
            <Toggle label="Special Needs" value={formData.hasSpecialNeeds} onChange={v => updateField("hasSpecialNeeds", v)} />
            <Toggle label="Medical Condition" value={formData.hasMedicalCondition} onChange={v => updateField("hasMedicalCondition", v)} />
            <Toggle label="Family Abroad" value={formData.familyAbroad} onChange={v => updateField("familyAbroad", v)} />
            <File label="Full Application PDF (Required)" file={files.documentUrl} onPress={() => pickFile("documentUrl")} />
            {formData.hasMedicalCondition && (
              <File label="Medical Report PDF" file={files.medicalReport} onPress={() => pickFile("medicalReport")} />
            )}
          </View>
        )}

        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={prevStep}>
              <Text style={styles.backButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < 6 ? (
            <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navButton, styles.submitButton]} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={modal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <FlatList
              data={modal.data}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => { updateField(modal.type, item); setModal({ visible: false, type: "", data: [] }) }}>
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModal({ visible: false, type: "", data: [] })}><Text style={styles.close}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const Input = ({ label, containerStyle, ...props }) => (
  <View style={[styles.field, containerStyle]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
  </View>
)
const Select = ({ label, value, onPress, containerStyle }) => (
  <View style={[styles.field, containerStyle]}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.select} onPress={onPress}>
      <Text style={styles.selectText}>{value || "Select"}</Text>
      <MaterialCommunityIcons name="chevron-down" size={20} />
    </TouchableOpacity>
  </View>
)
const Toggle = ({ label, value, onChange }) => (
  <View style={styles.toggle}>
    <Text style={styles.toggleText}>{label}</Text>
    <Switch value={value} onValueChange={onChange} />
  </View>
)
const File = ({ label, file, onPress }) => (
  <TouchableOpacity style={styles.file} onPress={onPress}>
    <MaterialCommunityIcons name={file ? "check-circle" : "file-pdf-box"} size={22} color={file ? COLORS.SUCCESS : COLORS.PRIMARY} />
    <Text style={[styles.fileText, file && { color: COLORS.SUCCESS }]}>{file ? file.name : label}</Text>
  </TouchableOpacity>
)
const Row = ({ children }) => <View style={styles.row}>{children}</View>

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  scroll: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 20, color: COLORS.PRIMARY },
  stepIndicator: { marginBottom: 20, alignItems: 'center' },
  stepText: { fontSize: 14, fontWeight: '600', color: COLORS.PRIMARY, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: COLORS.BORDER, borderRadius: 3, width: '100%' },
  progressFill: { height: '100%', backgroundColor: COLORS.PRIMARY, borderRadius: 3 },
  section: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12, color: COLORS.PRIMARY },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 4, color: COLORS.TEXT },
  input: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.BORDER },
  select: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.BORDER, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectText: { color: COLORS.TEXT },
  row: { flexDirection: "row", gap: 10 },
  toggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  toggleText: { color: COLORS.TEXT },
  file: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.BORDER, borderRadius: 8, marginBottom: 8 },
  fileText: { marginLeft: 10, fontSize: 13 },
  navigationButtons: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 40 },
  navButton: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center' },
  nextButton: { backgroundColor: COLORS.PRIMARY },
  nextButtonText: { color: '#fff', fontWeight: '700' },
  backButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.PRIMARY },
  backButtonText: { color: COLORS.PRIMARY, fontWeight: '700' },
  submitButton: { backgroundColor: COLORS.SUCCESS },
  submitText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" },
  item: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  itemText: { fontSize: 15 },
  close: { textAlign: "center", marginTop: 15, color: COLORS.ACCENT, fontWeight: "600" }
});