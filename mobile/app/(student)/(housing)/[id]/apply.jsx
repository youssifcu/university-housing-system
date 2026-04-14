import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
  Switch, Modal, FlatList, Alert, Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { auth } from "../../../../config/firebase";
import BACKEND_URL from "../../../../config/backend";

const COLORS = {
  PRIMARY: "#1A237E",
  TEXT: "#334155",
  BG: "#F8FAFC",
  WHITE: "#FFFFFF",
  BORDER: "#E2E8F0",
  ACCENT: "#EF4444",
  SUCCESS: "#10B981",
  DISABLED: "#94A3B8"
};

export default function HousingApplyScreen() {
  const router = useRouter();
  const { initialData } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [modal, setModal] = useState({ visible: false, type: "", data: [] });
  const [options, setOptions] = useState({
    genders: ["male", "female"],
    housingTypes: ["normal", "distinguished"],
    studentTypes: ["new", "returning"],
    academicYears: ["1", "2", "3", "4", "5", "6", "preparatory"]
  });

  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    studentType: "new",
    gender: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    college: "",
    academicYear: "",
    gpa: "",
    housingType: "normal",
    hasSpecialNeeds: false,
    specialNeedsDescription: ""
  });

  const [files, setFiles] = useState({
    personalPhoto: null,
    nationalIdCard: null,
    universityIdCard: null,
    medicalReport: null
  });

  const updateField = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) return "Full name is required";
      if (!/^\d{14}$/.test(formData.nationalId)) return "National ID must be 14 digits";
      if (!formData.gender) return "Gender is required";
      if (!formData.dateOfBirth) return "Birth date is required";
      const birthYear = new Date(formData.dateOfBirth).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear < 16) return "Student must be at least 16 years old";
    }
    if (currentStep === 2) {
      if (!formData.college.trim()) return "College is required";
      if (!formData.academicYear) return "Academic year is required";
      if (!/^01[0-2,5][0-9]{8}$/.test(formData.phoneNumber)) return "Invalid Egyptian phone number";
      if (!formData.address.trim()) return "Address is required";
      if (formData.gpa && (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4)) return "GPA must be between 0 and 4.0";
    }
    if (currentStep === 4) {
      if (!initialData) {
        if (!files.personalPhoto) return "Personal Photo is required";
        if (!files.nationalIdCard) return "National ID Card is required";
        if (!files.universityIdCard) return "University ID Card is required";
      }
    }
    return null;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      updateField("dateOfBirth", `${year}-${month}-${day}`);
    }
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) { Alert.alert("Required", error); return; }
    setCurrentStep(currentStep + 1);
  };

  const submit = async () => {
    const error = validateStep();
    if (error) { Alert.alert("Required", error); return; }
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const body = new FormData();
      body.append("fullName", formData.fullName);
      body.append("nationalId", formData.nationalId);
      body.append("studentType", formData.studentType);
      body.append("gender", formData.gender);
      body.append("dateOfBirth", formData.dateOfBirth);
      body.append("phoneNumber", formData.phoneNumber);
      body.append("address", formData.address);
      body.append("college", formData.college);
      body.append("academicYear", formData.academicYear);
      body.append("housingType", formData.housingType);
      if (formData.gpa) body.append("gpa", String(parseFloat(formData.gpa)));
      body.append("specialNeeds", JSON.stringify({
        hasSpecialNeeds: formData.hasSpecialNeeds,
        description: formData.specialNeedsDescription || ""
      }));
      if (files.personalPhoto) body.append("personalPhoto", { uri: files.personalPhoto.uri, name: "photo.jpg", type: "image/jpeg" });
      if (files.nationalIdCard) body.append("nationalIdCard", { uri: files.nationalIdCard.uri, name: "id.jpg", type: "image/jpeg" });
      if (files.universityIdCard) body.append("universityIdCard", { uri: files.universityIdCard.uri, name: "univ.jpg", type: "image/jpeg" });
      if (files.medicalReport) body.append("medicalReport", { uri: files.medicalReport.uri, name: "medical.pdf", type: "application/pdf" });

      const isEdit = !!initialData;
      const appId = isEdit ? JSON.parse(initialData)._id : null;
      const url = isEdit ? `${BACKEND_URL}/api/applications/${appId}` : `${BACKEND_URL}/api/applications`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body
      });
      const result = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Application submitted successfully", [
          { text: "OK", onPress: () => router.replace("/(student)/") }
        ]);
      } else {
        Alert.alert("Error", result.message || "Failed to submit application");
      }
    } catch (e) {
      Alert.alert("Error", "Network connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/applications/options`);
        const data = await res.json();
        if (res.ok) setOptions(prev => ({ ...prev, ...data }));
      } catch (e) {}
      if (initialData) {
        const data = JSON.parse(initialData);
        setFormData({
          fullName: data.fullName || "",
          nationalId: data.nationalId || "",
          studentType: data.studentType || "new",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : "",
          phoneNumber: data.phoneNumber || "",
          address: data.address || "",
          college: data.college || "",
          academicYear: data.academicYear || "",
          gpa: data.gpa?.toString() || "",
          housingType: data.housingType || "normal",
          hasSpecialNeeds: data.specialNeeds?.hasSpecialNeeds || false,
          specialNeedsDescription: data.specialNeeds?.description || ""
        });
      }
      setFetching(false);
    };
    init();
  }, [initialData]);

  const pickImage = async (key) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5
    });
    if (!result.canceled) setFiles(prev => ({ ...prev, [key]: result.assets[0] }));
  };

  const pickDoc = async (key) => {
    let res = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (!res.canceled) setFiles(prev => ({ ...prev, [key]: res.assets[0] }));
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.title}>{initialData ? "Edit Application" : "New Application"}</Text>
        </View>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step {currentStep} of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
          </View>
        </View>

        {currentStep === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Student Status</Text>
              <TouchableOpacity style={styles.select} onPress={() => setModal({ visible: true, type: "studentType", data: options.studentTypes })}>
                <Text style={styles.selectText}>{formData.studentType || "Select..."}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={formData.fullName} onChangeText={v => updateField("fullName", v)} placeholderTextColor={COLORS.DISABLED} placeholder="Enter full name" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>National ID</Text>
              <TextInput style={styles.input} value={formData.nationalId} maxLength={14} keyboardType="numeric" onChangeText={v => updateField("nationalId", v)} placeholderTextColor={COLORS.DISABLED} placeholder="14-digit ID" />
            </View>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Gender</Text>
                <TouchableOpacity style={styles.select} onPress={() => setModal({ visible: true, type: "gender", data: options.genders })}>
                  <Text style={styles.selectText}>{formData.gender || "Select..."}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Birth Date</Text>
                <TouchableOpacity style={styles.select} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.selectText}>{formData.dateOfBirth || "Select Date"}</Text>
                  <MaterialCommunityIcons name="calendar" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              </View>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic & Contact</Text>
            <View style={styles.field}>
              <Text style={styles.label}>College</Text>
              <TextInput style={styles.input} value={formData.college} onChangeText={v => updateField("college", v)} placeholderTextColor={COLORS.DISABLED} placeholder="Enter college" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Academic Year</Text>
              <TouchableOpacity style={styles.select} onPress={() => setModal({ visible: true, type: "academicYear", data: options.academicYears })}>
                <Text style={styles.selectText}>{formData.academicYear || "Select..."}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>GPA</Text>
              <TextInput style={styles.input} value={formData.gpa} keyboardType="numeric" onChangeText={v => updateField("gpa", v)} placeholderTextColor={COLORS.DISABLED} placeholder="0.0 - 4.0" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={formData.phoneNumber} keyboardType="phone-pad" onChangeText={v => updateField("phoneNumber", v)} placeholderTextColor={COLORS.DISABLED} placeholder="01xxxxxxxxx" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Full Address</Text>
              <TextInput style={styles.input} value={formData.address} onChangeText={v => updateField("address", v)} placeholderTextColor={COLORS.DISABLED} placeholder="Enter address" />
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Housing Category</Text>
              <TouchableOpacity style={styles.select} onPress={() => setModal({ visible: true, type: "housingType", data: options.housingTypes })}>
                <Text style={styles.selectText}>{formData.housingType || "Select..."}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>Special Needs Support</Text>
              <Switch value={formData.hasSpecialNeeds} onValueChange={v => updateField("hasSpecialNeeds", v)} trackColor={{ true: COLORS.PRIMARY }} />
            </View>
            {formData.hasSpecialNeeds && (
              <View style={styles.field}>
                <Text style={styles.label}>Description of needs</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={formData.specialNeedsDescription}
                  onChangeText={v => updateField("specialNeedsDescription", v)}
                  placeholderTextColor={COLORS.DISABLED}
                  placeholder="Describe your needs..."
                  multiline
                />
              </View>
            )}
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            {[
              { key: "personalPhoto", label: "Personal Photo", icon: "account-box", isImage: true },
              { key: "nationalIdCard", label: "National ID", icon: "card-account-details", isImage: true },
              { key: "universityIdCard", label: "University ID", icon: "school", isImage: true },
              { key: "medicalReport", label: "Medical Report (PDF)", icon: "file-pdf-box", isImage: false },
            ].map(({ key, label, icon, isImage }) => (
              <TouchableOpacity key={key} style={styles.file} onPress={() => isImage ? pickImage(key) : pickDoc(key)}>
                <MaterialCommunityIcons name={files[key] ? "check-circle" : icon} size={22} color={files[key] ? COLORS.SUCCESS : COLORS.PRIMARY} />
                <Text style={[styles.fileText, files[key] && { color: COLORS.SUCCESS, fontWeight: 'bold' }]}>
                  {files[key] ? "Ready" : label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => setCurrentStep(currentStep - 1)}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          {currentStep < 4 ? (
            <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext}>
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
                <TouchableOpacity style={styles.item} onPress={() => { updateField(modal.type, item); setModal({ visible: false, type: "", data: [] }); }}>
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModal({ visible: false, type: "", data: [] })}>
              <Text style={styles.close}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  scroll: { padding: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.PRIMARY, flex: 1 },
  stepIndicator: { marginBottom: 20 },
  stepText: { fontSize: 14, fontWeight: '700', color: COLORS.PRIMARY, marginBottom: 8, textAlign: 'center' },
  progressBar: { height: 8, backgroundColor: COLORS.BORDER, borderRadius: 4, width: '100%' },
  progressFill: { height: '100%', backgroundColor: COLORS.PRIMARY, borderRadius: 4 },
  section: { backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 16, color: COLORS.PRIMARY },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6, color: COLORS.TEXT },
  input: { backgroundColor: "#F8FAFC", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.BORDER, color: COLORS.TEXT },
  select: { backgroundColor: "#F8FAFC", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.BORDER, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectText: { color: COLORS.TEXT },
  row: { flexDirection: "row", gap: 12 },
  toggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  toggleText: { color: COLORS.TEXT, fontWeight: '600' },
  file: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.BORDER, borderRadius: 12, marginBottom: 10 },
  fileText: { marginLeft: 12, fontSize: 14, color: COLORS.TEXT },
  navigationButtons: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 50 },
  navButton: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
  nextButton: { backgroundColor: COLORS.PRIMARY },
  nextButtonText: { color: '#fff', fontWeight: '800' },
  backButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.PRIMARY },
  backButtonText: { color: COLORS.PRIMARY, fontWeight: '800' },
  submitButton: { backgroundColor: COLORS.SUCCESS },
  submitText: { color: "#fff", fontWeight: "900" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%" },
  item: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  itemText: { fontSize: 16, textAlign: 'center' },
  close: { textAlign: "center", marginTop: 20, color: COLORS.ACCENT, fontWeight: "700" }
});
