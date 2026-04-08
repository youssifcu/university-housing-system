import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  Alert
} from "react-native"
import { useRouter } from "expo-router"
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
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isNewStudent, setIsNewStudent] = useState(false)

  const [modal, setModal] = useState({
    visible: false,
    type: "",
    data: []
  })

  const [options, setOptions] = useState({
    faculties: [],
    levels: [],
    departments: [],
    governorates: {},
    genders: ["Male", "Female"],
    religions: ["Muslim", "Christian"],
    parentStatuses: [],
    housingTypes: [],
    grades: [],
    previousHousing: []
  })

  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    studentAffairsNumber: "",
    gender: "",
    religion: "",
    birthDate: "",
    birthPlace: "",
    faculty: "",
    academicLevel: "",
    department: "",
    gov: "",
    city: "",
    village: "",
    addressDetails: "",
    email: "",
    mobile: "",
    fatherName: "",
    fatherNationalId: "",
    fatherJob: "",
    fatherPhone: "",
    fatherAddress: "",
    guardianName: "",
    guardianRelation: "",
    guardianMobile: "",
    parentStatus: "",
    lastYearGrade: "",
    gpa: "",
    previousHousing: "",
    housingType: "",
    noFood: false,
    specialNeeds: false,
    chronicIllness: false,
    familyAbroad: false
  })

  const [files, setFiles] = useState({
    studentId: null,
    fatherId: null,
    utilityBill: null,
    criminalRecord: null,
    clearance: null,
    medicalReport: null
  })

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/housing/options`)
      const data = await res.json()
      if (res.ok) {
        setOptions({
          ...options,
          faculties: data.faculties || [],
          levels: data.levels || [],
          departments: data.departments || [],
          governorates: data.governorates || {},
          parentStatuses: data.parentStatuses || [],
          housingTypes: data.housingTypes || [],
          grades: data.grades || [],
          previousHousing: data.previousHousing || []
        })
      }
    } catch (e) {
      console.log(e)
    }
    setFetching(false)
  }

  const updateField = (k, v) => {
    setFormData(prev => ({ ...prev, [k]: v }))
  }

  const openPicker = (type, data) => {
    setModal({ visible: true, type, data })
  }

  const selectItem = (item) => {
    updateField(modal.type, item)
    if (modal.type === "gov") {
      updateField("city", "")
      updateField("village", "")
    }
    if (modal.type === "city") {
      updateField("village", "")
    }
    setModal({ visible: false, type: "", data: [] })
  }

  const pickFile = async (key) => {
    let res = await DocumentPicker.getDocumentAsync({ type: "application/pdf" })
    if (!res.canceled) {
      setFiles(prev => ({ ...prev, [key]: res.assets[0] }))
    }
  }

  const validateFiles = () => {
    const requiredKeys = ["studentId", "fatherId", "utilityBill", "criminalRecord", "clearance", "medicalReport"];
    return requiredKeys.every(key => files[key] !== null);
  }

  const submit = async () => {
    if (!validateFiles()) {
      Alert.alert("Missing Documents", "Please upload all required PDF files.");
      return;
    }

    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const body = new FormData()

      Object.keys(formData).forEach(k => {
        body.append(k, formData[k])
      })

      Object.keys(files).forEach(k => {
        if (files[k]) {
          body.append(k, {
            uri: files[k].uri,
            name: files[k].name,
            type: "application/pdf"
          })
        }
      })

      const res = await fetch(`${BACKEND_URL}/api/housing/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body
      })

      if (res.ok) {
        Alert.alert("Success", "Application submitted successfully");
        router.back()
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Submission failed");
      }
    } catch (e) {
      Alert.alert("Error", "Network error occurred");
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    )
  }

  const allFilesUploaded = validateFiles();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Dormitory Application</Text>

        <View style={styles.switchRow}>
          <Text style={styles.label}>New Student</Text>
          <Switch value={isNewStudent} onValueChange={setIsNewStudent} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <Input label="Full Name" value={formData.name} onChangeText={v => updateField("name", v)} />
          <Input label="National ID" value={formData.nationalId} onChangeText={v => updateField("nationalId", v)} />
          <Input label="Student Affairs Number" value={formData.studentAffairsNumber} onChangeText={v => updateField("studentAffairsNumber", v)} />
          <Row>
            <Select label="Gender" value={formData.gender} onPress={() => openPicker("gender", options.genders)} />
            <Select label="Religion" value={formData.religion} onPress={() => openPicker("religion", options.religions)} />
          </Row>
          <Input label="Birth Date" value={formData.birthDate} onChangeText={v => updateField("birthDate", v)} />
          <Input label="Birth Place" value={formData.birthPlace} onChangeText={v => updateField("birthPlace", v)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          <Select label="Faculty" value={formData.faculty} onPress={() => openPicker("faculty", options.faculties)} />
          <Select label="Level" value={formData.academicLevel} onPress={() => openPicker("academicLevel", options.levels)} />
          <Select label="Department" value={formData.department} onPress={() => openPicker("department", options.departments)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <Select label="Governorate" value={formData.gov} onPress={() => openPicker("gov", Object.keys(options.governorates))} />
          <Select label="City" value={formData.city} onPress={() => formData.gov ? openPicker("city", Object.keys(options.governorates[formData.gov])) : null} />
          <Select label="Village" value={formData.village} onPress={() => formData.city ? openPicker("village", options.governorates[formData.gov][formData.city]) : null} />
          <Input label="Detailed Address" value={formData.addressDetails} onChangeText={v => updateField("addressDetails", v)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Father Information</Text>
          <Input label="Father Name" value={formData.fatherName} onChangeText={v => updateField("fatherName", v)} />
          <Input label="Father National ID" value={formData.fatherNationalId} onChangeText={v => updateField("fatherNationalId", v)} />
          <Input label="Father Job" value={formData.fatherJob} onChangeText={v => updateField("fatherJob", v)} />
          <Input label="Father Phone" value={formData.fatherPhone} onChangeText={v => updateField("fatherPhone", v)} />
          <Input label="Father Address" value={formData.fatherAddress} onChangeText={v => updateField("fatherAddress", v)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guardian Information</Text>
          <Input label="Guardian Name" value={formData.guardianName} onChangeText={v => updateField("guardianName", v)} />
          <Input label="Relation" value={formData.guardianRelation} onChangeText={v => updateField("guardianRelation", v)} />
          <Input label="Guardian Phone" value={formData.guardianMobile} onChangeText={v => updateField("guardianMobile", v)} />
        </View>

        {!isNewStudent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Academic Data</Text>
            <Select label="Last Year Grade" value={formData.lastYearGrade} onPress={() => openPicker("lastYearGrade", options.grades)} />
            <Input label="GPA" value={formData.gpa} onChangeText={v => updateField("gpa", v)} />
            <Select label="Previous Housing" value={formData.previousHousing} onPress={() => openPicker("previousHousing", options.previousHousing)} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Housing</Text>
          <Select label="Housing Type" value={formData.housingType} onPress={() => openPicker("housingType", options.housingTypes)} />
          <Toggle label="No Food" value={formData.noFood} onChange={v => updateField("noFood", v)} />
          <Toggle label="Special Needs" value={formData.specialNeeds} onChange={v => updateField("specialNeeds", v)} />
          <Toggle label="Chronic Illness" value={formData.chronicIllness} onChange={v => updateField("chronicIllness", v)} />
          <Toggle label="Family Abroad" value={formData.familyAbroad} onChange={v => updateField("familyAbroad", v)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents (Required)</Text>
          <File label="Student ID Card" file={files.studentId} onPress={() => pickFile("studentId")} />
          <File label="Father ID Card" file={files.fatherId} onPress={() => pickFile("fatherId")} />
          <File label="Utility Bill" file={files.utilityBill} onPress={() => pickFile("utilityBill")} />
          <File label="Criminal Record" file={files.criminalRecord} onPress={() => pickFile("criminalRecord")} />
          <File label="Previous Clearance" file={files.clearance} onPress={() => pickFile("clearance")} />
          <File label="Medical Report" file={files.medicalReport} onPress={() => pickFile("medicalReport")} />
        </View>

        <TouchableOpacity 
          style={[styles.submit, !allFilesUploaded && { backgroundColor: COLORS.DISABLED }]} 
          onPress={submit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{allFilesUploaded ? "Submit" : "Upload All Files First"}</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <FlatList
              data={modal.data}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => selectItem(item)}>
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModal({ visible: false, type: "", data: [] })}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const Input = ({ label, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
  </View>
)

const Select = ({ label, value, onPress }) => (
  <View style={styles.field}>
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
    <MaterialCommunityIcons 
      name={file ? "check-circle" : "file-pdf-box"} 
      size={22} 
      color={file ? COLORS.SUCCESS : COLORS.PRIMARY} 
    />
    <Text style={[styles.fileText, file && { color: COLORS.SUCCESS }]}>{file ? file.name : label}</Text>
  </TouchableOpacity>
)

const Row = ({ children }) => (
  <View style={styles.row}>{children}</View>
)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  scroll: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 20, color: COLORS.PRIMARY },
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
  submit: { backgroundColor: COLORS.PRIMARY, padding: 16, borderRadius: 10, alignItems: "center", marginBottom: 40 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingHorizontal: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" },
  item: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  itemText: { fontSize: 15 },
  close: { textAlign: "center", marginTop: 15, color: COLORS.ACCENT, fontWeight: "600" }
})