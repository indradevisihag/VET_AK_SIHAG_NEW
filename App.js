import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANIMAL_TYPES = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Dog', 'Cat', 'Horse', 'Other'];

function App() {
  const [screen, setScreen] = useState('loading');
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editing, setEditing] = useState(false);

  const emptyPatient = {
    animalType: 'Cow',
    animalId: '',
    ownerName: '',
    ownerMobile: '',
    age: '',
    sex: 'Male',
    history: '',
  };

  const emptyMedicine = {
    medicine: '',
    dose: '',
    route: 'Oral',
    frequency: '',
    duration: '',
    instructions: '',
  };

  const [form, setForm] = useState(emptyPatient);
  const [medicineForm, setMedicineForm] = useState(emptyMedicine);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen === "patients") { setScreen("dashboard"); return true; }
      if (screen === "patientDetails") { setScreen("patients"); return true; }
      if (screen === "prescriptionPatients") { setScreen("dashboard"); return true; }
      if (screen === "prescriptions") { setScreen("prescriptionPatients"); return true; }
      if (screen === "prescriptionDetails") { setScreen("prescriptions"); return true; }
      if (screen === "prescriptionForm") { setScreen("prescriptions"); return true; }
      if (screen === "patientForm") { setScreen(editing ? "patientDetails" : "patients"); return true; }
      if (screen === "create") { setScreen("login"); return true; }
      return false;
    });
    return () => backSubscription.remove();
    loadApp();
  }, []);

  const loadApp = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      const loggedIn = await AsyncStorage.getItem('loggedIn');
      const savedPatients = await AsyncStorage.getItem('patients');
      const savedPrescriptions = await AsyncStorage.getItem('prescriptions');

      if (savedPatients) setPatients(JSON.parse(savedPatients));
      if (savedPrescriptions) setPrescriptions(JSON.parse(savedPrescriptions));

      if (savedUser && loggedIn === 'true') {
        setUser(JSON.parse(savedUser));
        setScreen('dashboard');
      } else {
        setScreen('login');
      }
    } catch (error) {
      setScreen('login');
    }
  };

  const savePatients = async (data) => {
    setPatients(data);
    await AsyncStorage.setItem('patients', JSON.stringify(data));
  };

  const savePrescriptions = async (data) => {
    setPrescriptions(data);
    await AsyncStorage.setItem('prescriptions', JSON.stringify(data));
  };

  const login = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Email/Mobile और Password भरें।');
      return;
    }

    const saved = await AsyncStorage.getItem('user');

    if (!saved) {
      Alert.alert('Account नहीं मिला', 'पहले Create Account करें।');
      return;
    }

    const account = JSON.parse(saved);

    if (
      account.email.toLowerCase() === email.trim().toLowerCase() &&
      account.password === password
    ) {
      setUser(account);
      await AsyncStorage.setItem('loggedIn', 'true');
      setScreen('dashboard');
      setPassword('');
    } else {
      Alert.alert('Login Failed', 'Email/Mobile या Password गलत है।');
    }
  };

  const createAccount = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Required', 'सभी fields भरें।');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password', 'Password कम से कम 6 characters का होना चाहिए।');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password', 'दोनों passwords समान नहीं हैं।');
      return;
    }

    const newUser = {
      email: email.trim(),
      password,
      name: 'VET AK SIHAG',
    };

    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    await AsyncStorage.setItem('loggedIn', 'true');

    setUser(newUser);
    setConfirmPassword('');
    setPassword('');
    setScreen('dashboard');
  };

  const logout = async () => {
    await AsyncStorage.setItem('loggedIn', 'false');
    setUser(null);
    setEmail('');
    setPassword('');
    setScreen('login');
  };

  const openNewPatient = () => {
    setForm(emptyPatient);
    setEditing(false);
    setSelectedPatient(null);
    setScreen('patientForm');
  };

  const openEditPatient = (patient) => {
    setForm({
      animalType: patient.animalType || 'Cow',
      animalId: patient.animalId || '',
      ownerName: patient.ownerName || '',
      ownerMobile: patient.ownerMobile || '',
      age: patient.age || '',
      sex: patient.sex || 'Male',
      history: patient.history || '',
    });

    setSelectedPatient(patient);
    setEditing(true);
    setScreen('patientForm');
  };

  const savePatient = async () => {
    if (!form.animalId.trim()) {
      Alert.alert('Required', 'Animal / Patient ID भरें।');
      return;
    }

    if (!form.ownerName.trim()) {
      Alert.alert('Required', 'Owner Name भरें।');
      return;
    }

    if (editing && selectedPatient) {
      const updated = patients.map((p) =>
        p.id === selectedPatient.id
          ? { ...p, ...form, updatedAt: new Date().toISOString() }
          : p
      );

      await savePatients(updated);
      Alert.alert('Success', 'Patient details update हो गईं।');
    } else {
      const newPatient = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toISOString(),
      };

      await savePatients([newPatient, ...patients]);
      Alert.alert('Success', 'New patient save हो गया।');
    }

    setScreen('patients');
    setSelectedPatient(null);
    setEditing(false);
  };

  const deletePatient = (patient) => {
    Alert.alert(
      'Delete Patient',
      `${patient.animalId} को delete करना है?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = patients.filter((p) => p.id !== patient.id);
            await savePatients(updated);
            setSelectedPatient(null);
            setScreen('patients');
          },
        },
      ]
    );
  };

  const filteredPatients = patients.filter((p) => {
    const text = search.toLowerCase();

    return (
      (p.animalId || '').toLowerCase().includes(text) ||
      (p.ownerName || '').toLowerCase().includes(text) ||
      (p.ownerMobile || '').toLowerCase().includes(text) ||
      (p.animalType || '').toLowerCase().includes(text)
    );
  });

  const patientPrescriptions = selectedPatient
    ? prescriptions.filter((p) => p.patientId === selectedPatient.id)
    : [];

  const savePrescription = async () => {
    if (!selectedPatient) {
      Alert.alert('Patient Required', 'पहले patient select करें।');
      return;
    }

    if (!medicineForm.medicine.trim()) {
      Alert.alert('Required', 'Medicine name भरें।');
      return;
    }

    if (!medicineForm.dose.trim()) {
      Alert.alert('Required', 'Dose भरें।');
      return;
    }

    const newPrescription = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.animalType,
      animalId: selectedPatient.animalId,
      ownerName: selectedPatient.ownerName,
      medicine: medicineForm.medicine.trim(),
      dose: medicineForm.dose.trim(),
      route: medicineForm.route,
      frequency: medicineForm.frequency.trim(),
      duration: medicineForm.duration.trim(),
      instructions: medicineForm.instructions.trim(),
      notes: prescriptionNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    await savePrescriptions([newPrescription, ...prescriptions]);

    setMedicineForm(emptyMedicine);
    setPrescriptionNotes('');
    Alert.alert('Success', 'Prescription save हो गया।');
    setScreen('prescriptions');
  };

  const deletePrescription = (prescription) => {
    Alert.alert(
      'Delete Prescription',
      'यह prescription delete करना है?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = prescriptions.filter((p) => p.id !== prescription.id);
            await savePrescriptions(updated);
            setSelectedPrescription(null);
            setScreen('prescriptions');
          },
        },
      ]
    );
  };

  if (screen === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loadingText}>VET AK SIHAG</Text>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (screen === 'login' || screen === 'create') {
    const isCreate = screen === 'create';

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.authContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.brand}>VET AK SIHAG</Text>
              <Text style={styles.subtitle}>Veterinary Management App</Text>
            </View>

            <Text style={styles.title}>
              {isCreate ? 'Create Account' : 'Welcome Back'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email / Mobile"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {isCreate && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={isCreate ? createAccount : login}
            >
              <Text style={styles.buttonText}>
                {isCreate ? 'Create Account' : 'Login'}
              </Text>
            </TouchableOpacity>

            {!isCreate && (
              <TouchableOpacity
                style={styles.textButton}
                onPress={() =>
                  Alert.alert(
                    'Forgot Password',
                    'Local version में password recovery अभी उपलब्ध नहीं है।'
                  )
                }
              >
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => {
                setScreen(isCreate ? 'login' : 'create');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <Text style={styles.linkText}>
                {isCreate
                  ? 'Already have an account? Login'
                  : 'Create New Account'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (screen === 'dashboard') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.dashboard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brandSmall}>VET AK SIHAG</Text>
              <Text style={styles.welcome}>Veterinary Dashboard</Text>
            </View>

            <TouchableOpacity onPress={logout}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Patients</Text>
            <Text style={styles.patientCount}>{patients.length}</Text>
            <Text style={styles.muted}>Registered animals</Text>
          </View>

          <TouchableOpacity
            style={styles.bigButton}
            onPress={() => setScreen('patients')}
          >
            <Text style={styles.bigButtonText}>🐄 Patients</Text>
            <Text style={styles.bigButtonSub}>View & Search Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bigButton} onPress={openNewPatient}>
            <Text style={styles.bigButtonText}>➕ New Patient</Text>
            <Text style={styles.bigButtonSub}>Register a new animal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bigButton}
            onPress={() => {
              if (patients.length === 0) {
                Alert.alert('No Patients', 'पहले patient add करें।');
              } else {
                setScreen('prescriptionPatients');
              }
            }}
          >
            <Text style={styles.bigButtonText}>💊 Prescription</Text>
            <Text style={styles.bigButtonSub}>Create & view prescriptions</Text>
          </TouchableOpacity>

          <View style={styles.quickGrid}>
            <QuickButton title="🩺 Diagnosis" />
            <QuickButton title="💉 Vaccination" />
            <QuickButton title="📊 Reports" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'patients') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => setScreen('dashboard')}>
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Patients</Text>

          <TouchableOpacity onPress={openNewPatient}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search ID, owner, mobile, animal..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {filteredPatients.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {patients.length === 0
                  ? 'No patients yet'
                  : 'No matching patient'}
              </Text>
              <Text style={styles.muted}>
                {patients.length === 0
                  ? 'Add your first patient.'
                  : 'Search with another name or ID.'}
              </Text>
            </View>
          ) : (
            filteredPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientCard}
                onPress={() => {
                  setSelectedPatient(patient);
                  setScreen('patientDetails');
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>
                    {patient.animalType} • {patient.animalId}
                  </Text>
                  <Text style={styles.patientInfo}>
                    Owner: {patient.ownerName}
                  </Text>
                  <Text style={styles.patientInfo}>
                    Mobile: {patient.ownerMobile || '-'}
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'patientDetails' && selectedPatient) {
    const p = selectedPatient;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.details}>
          <TouchableOpacity
            onPress={() => {
              setSelectedPatient(null);
              setScreen('patients');
            }}
          >
            <Text style={styles.back}>‹ Back to Patients</Text>
          </TouchableOpacity>

          <Text style={styles.detailsTitle}>{p.animalType}</Text>
          <Text style={styles.detailsId}>Patient ID: {p.animalId}</Text>

          <DetailRow label="Owner Name" value={p.ownerName} />
          <DetailRow label="Owner Mobile" value={p.ownerMobile || '-'} />
          <DetailRow label="Age" value={p.age || '-'} />
          <DetailRow label="Sex" value={p.sex || '-'} />
          <DetailRow label="Clinical History" value={p.history || '-'} />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => openEditPatient(p)}
          >
            <Text style={styles.buttonText}>✏️ Edit Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.prescriptionButton}
            onPress={() => setScreen('prescriptions')}
          >
            <Text style={styles.prescriptionText}>💊 Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePatient(p)}
          >
            <Text style={styles.deleteText}>Delete Patient</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'prescriptionPatients') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => setScreen('dashboard')}>
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Select Patient</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {patients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              onPress={() => {
                setSelectedPatient(patient);
                setScreen('prescriptions');
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>
                  {patient.animalType} • {patient.animalId}
                </Text>
                <Text style={styles.patientInfo}>
                  Owner: {patient.ownerName}
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'prescriptions' && selectedPatient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => setScreen('dashboard')}>
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Prescriptions</Text>

          <TouchableOpacity
            onPress={() => {
              setMedicineForm(emptyMedicine);
              setPrescriptionNotes('');
              setScreen('prescriptionForm');
            }}
          >
            <Text style={styles.addText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.details}>
          <View style={styles.patientHeaderCard}>
            <Text style={styles.patientName}>
              {selectedPatient.animalType} • {selectedPatient.animalId}
            </Text>
            <Text style={styles.patientInfo}>
              Owner: {selectedPatient.ownerName}
            </Text>
          </View>

          {patientPrescriptions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No prescriptions</Text>
              <Text style={styles.muted}>
                Tap + New to create the first prescription.
              </Text>
            </View>
          ) : (
            patientPrescriptions.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.prescriptionCard}
                onPress={() => {
                  setSelectedPrescription(p);
                  setScreen('prescriptionDetails');
                }}
              >
                <Text style={styles.patientName}>{p.medicine}</Text>
                <Text style={styles.patientInfo}>
                  Dose: {p.dose} • {p.route}
                </Text>
                <Text style={styles.patientInfo}>
                  {p.frequency || 'Frequency not specified'} •{' '}
                  {p.duration || 'Duration not specified'}
                </Text>
                <Text style={styles.dateText}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'prescriptionForm') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.formContainer}>
            <TouchableOpacity onPress={() => setScreen('prescriptions')}>
              <Text style={styles.back}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>New Prescription</Text>

            <View style={styles.patientHeaderCard}>
              <Text style={styles.patientName}>
                {selectedPatient?.animalType} • {selectedPatient?.animalId}
              </Text>
              <Text style={styles.patientInfo}>
                Owner: {selectedPatient?.ownerName}
              </Text>
            </View>

            <Text style={styles.label}>Medicine Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: Amoxicillin"
              value={medicineForm.medicine}
              onChangeText={(v) =>
                setMedicineForm({ ...medicineForm, medicine: v })
              }
            />

            <Text style={styles.label}>Dose *</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: 10 mg/kg"
              value={medicineForm.dose}
              onChangeText={(v) =>
                setMedicineForm({ ...medicineForm, dose: v })
              }
            />

            <Text style={styles.label}>Route</Text>
            <View style={styles.routeRow}>
              {['Oral', 'IV', 'IM', 'SC', 'Topical'].map((route) => (
                <TouchableOpacity
                  key={route}
                  style={[
                    styles.routeButton,
                    medicineForm.route === route && styles.routeActive,
                  ]}
                  onPress={() =>
                    setMedicineForm({ ...medicineForm, route })
                  }
                >
                  <Text
                    style={
                      medicineForm.route === route
                        ? styles.routeTextActive
                        : styles.routeText
                    }
                  >
                    {route}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Frequency</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: Twice daily"
              value={medicineForm.frequency}
              onChangeText={(v) =>
                setMedicineForm({ ...medicineForm, frequency: v })
              }
            />

            <Text style={styles.label}>Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: 5 days"
              value={medicineForm.duration}
              onChangeText={(v) =>
                setMedicineForm({ ...medicineForm, duration: v })
              }
            />

            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Before/after food, special instructions..."
              value={medicineForm.instructions}
              onChangeText={(v) =>
                setMedicineForm({ ...medicineForm, instructions: v })
              }
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Doctor Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional clinical notes..."
              value={prescriptionNotes}
              onChangeText={setPrescriptionNotes}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={savePrescription}
            >
              <Text style={styles.buttonText}>Save Prescription</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (screen === 'prescriptionDetails' && selectedPrescription) {
    const p = selectedPrescription;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.details}>
          <TouchableOpacity onPress={() => setScreen('prescriptions')}>
            <Text style={styles.back}>‹ Back to Prescriptions</Text>
          </TouchableOpacity>

          <Text style={styles.detailsTitle}>{p.medicine}</Text>
          <Text style={styles.detailsId}>
            {p.animalId} • {p.ownerName}
          </Text>

          <DetailRow label="Dose" value={p.dose} />
          <DetailRow label="Route" value={p.route} />
          <DetailRow label="Frequency" value={p.frequency || '-'} />
          <DetailRow label="Duration" value={p.duration || '-'} />
          <DetailRow label="Instructions" value={p.instructions || '-'} />
          <DetailRow label="Doctor Notes" value={p.notes || '-'} />
          <DetailRow
            label="Date"
            value={new Date(p.createdAt).toLocaleDateString()}
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePrescription(p)}
          >
            <Text style={styles.deleteText}>Delete Prescription</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'patientForm') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.formContainer}>
            <TouchableOpacity
              onPress={() => {
                setScreen('patients');
                setSelectedPatient(null);
                setEditing(false);
              }}
            >
              <Text style={styles.back}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              {editing ? 'Edit Patient' : 'New Patient'}
            </Text>

            <Text style={styles.label}>Animal Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ANIMAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    form.animalType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setForm({ ...form, animalType: type })}
                >
                  <Text
                    style={[
                      styles.typeText,
                      form.animalType === type && styles.typeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Animal / Patient ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: COW-001"
              value={form.animalId}
              onChangeText={(v) => setForm({ ...form, animalId: v })}
            />

            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Owner name"
              value={form.ownerName}
              onChangeText={(v) => setForm({ ...form, ownerName: v })}
            />

            <Text style={styles.label}>Owner Mobile</Text>
            <TextInput
              style={styles.input}
              placeholder="10 digit mobile"
              keyboardType="phone-pad"
              value={form.ownerMobile}
              onChangeText={(v) => setForm({ ...form, ownerMobile: v })}
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: 3 years"
              value={form.age}
              onChangeText={(v) => setForm({ ...form, age: v })}
            />

            <Text style={styles.label}>Sex</Text>
            <View style={styles.sexRow}>
              <TouchableOpacity
                style={[
                  styles.sexButton,
                  form.sex === 'Male' && styles.sexActive,
                ]}
                onPress={() => setForm({ ...form, sex: 'Male' })}
              >
                <Text>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sexButton,
                  form.sex === 'Female' && styles.sexActive,
                ]}
                onPress={() => setForm({ ...form, sex: 'Female' })}
              >
                <Text>Female</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Clinical History</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Symptoms, previous treatment, history..."
              value={form.history}
              onChangeText={(v) => setForm({ ...form, history: v })}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={savePatient}
            >
              <Text style={styles.buttonText}>
                {editing ? 'Update Patient' : 'Save Patient'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

function QuickButton({ title }) {
  return (
    <TouchableOpacity
      style={styles.quickButton}
      onPress={() =>
        Alert.alert(
          'Coming Soon',
          `${title.replace(/[^\w ]/g, '')} feature जल्द जोड़ा जाएगा।`
        )
      }
    >
      <Text style={styles.quickText}>{title}</Text>
    </TouchableOpacity>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8F7',
  },
  loadingText: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brand: {
    fontSize: 30,
    fontWeight: '900',
    color: '#123B32',
  },
  brandSmall: {
    fontSize: 21,
    fontWeight: '900',
    color: '#123B32',
  },
  subtitle: {
    marginTop: 6,
    color: '#66736F',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#173C35',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1DE',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 13,
  },
  primaryButton: {
    backgroundColor: '#176B57',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 13,
  },
  linkText: {
    color: '#176B57',
    fontWeight: '700',
  },
  dashboard: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcome: {
    color: '#687570',
    marginTop: 3,
  },
  logout: {
    color: '#B3261E',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    color: '#687570',
  },
  patientCount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#176B57',
    marginTop: 4,
  },
  muted: {
    color: '#7A8581',
    marginTop: 3,
  },
  bigButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
  },
  bigButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#173C35',
  },
  bigButtonSub: {
    color: '#74807B',
    marginTop: 5,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  quickButton: {
    width: '48%',
    backgroundColor: '#E7F1ED',
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
  },
  quickText: {
    fontWeight: '700',
    color: '#245448',
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#173C35',
  },
  back: {
    color: '#176B57',
    fontSize: 16,
    fontWeight: '700',
  },
  addText: {
    color: '#176B57',
    fontWeight: '800',
    fontSize: 16,
  },
  searchBox: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E1DE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#173C35',
  },
  patientInfo: {
    color: '#6E7975',
    marginTop: 4,
  },
  arrow: {
    fontSize: 28,
    color: '#176B57',
    marginLeft: 10,
  },
  empty: {
    alignItems: 'center',
    padding: 45,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#173C35',
  },
  details: {
    padding: 20,
    paddingBottom: 40,
  },
  detailsTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#173C35',
    marginTop: 25,
  },
  detailsId: {
    color: '#176B57',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 18,
  },
  detailRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#77827E',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#173C35',
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#35564D',
    marginBottom: 8,
    marginTop: 5,
  },
  typeButton: {
    borderWidth: 1,
    borderColor: '#C9D9D4',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#176B57',
    borderColor: '#176B57',
  },
  typeText: {
    color: '#35564D',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  sexRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sexButton: {
    borderWidth: 1,
    borderColor: '#C9D9D4',
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginRight: 10,
  },
  sexActive: {
    backgroundColor: '#DCEDE7',
    borderColor: '#176B57',
  },
  textArea: {
    minHeight: 110,
  },
  patientHeaderCard: {
    backgroundColor: '#E7F1ED',
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
  },
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 11,
    elevation: 1,
  },
  prescriptionButton: {
    backgroundColor: '#E7F1ED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  prescriptionText: {
    color: '#176B57',
    fontWeight: '800',
    fontSize: 16,
  },
  dateText: {
    color: '#8A9490',
    fontSize: 12,
    marginTop: 8,
  },
  routeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  routeButton: {
    borderWidth: 1,
    borderColor: '#C9D9D4',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  routeActive: {
    backgroundColor: '#176B57',
    borderColor: '#176B57',
  },
  routeText: {
    color: '#35564D',
    fontWeight: '600',
  },
  routeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#D14343',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteText: {
    color: '#B3261E',
    fontWeight: '800',
  },
});

export default App;
