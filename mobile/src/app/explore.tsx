import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';

import { API_BASE_URL } from '@/constants/api';

type User = {
  id: number;
  name: string;
  interests: string[];
  location: string;
  skill_level: string;
  availability: string[];
};

export default function ExploreScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [interests, setInterests] = useState('');
  const [location, setLocation] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [availability, setAvailability] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await fetch(`${API_BASE_URL}/users`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setErrorMessage('Could not load users.');
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const parsedInterests = interests
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const parsedAvailability = availability
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const normalizedLocation = location.trim();
    const normalizedSkillLevel = skillLevel.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setFormError('Name is required.');
      return;
    }

    if (parsedInterests.length === 0) {
      setFormError('Enter at least one interest.');
      return;
    }

    if (!normalizedLocation) {
      setFormError('Location is required.');
      return;
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(normalizedSkillLevel)) {
      setFormError('Skill level must be beginner, intermediate, or advanced.');
      return;
    }

    if (parsedAvailability.length === 0) {
      setFormError('Enter at least one availability value.');
      return;
    }

    try {
      setCreatingUser(true);
      setErrorMessage(null);
      setFormError(null);

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          interests: parsedInterests,
          location: normalizedLocation,
          skill_level: normalizedSkillLevel,
          availability: parsedAvailability,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      setName('');
      setInterests('');
      setLocation('');
      setSkillLevel('');
      setAvailability('');

      await fetchUsers();
    } catch (error) {
      setErrorMessage('Could not create user.');
      console.log('Error:', error);
    } finally {
      setCreatingUser(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Explore Users</Text>
        <Text style={styles.subtitle}>Browse users and create new ones.</Text>

        <View style={styles.formBox}>
          <Text style={styles.sectionTitle}>Create User</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Interests (example: basketball, tennis)"
            value={interests}
            onChangeText={setInterests}
          />

          <TextInput
            style={styles.input}
            placeholder="Location (example: Monastiraki)"
            value={location}
            onChangeText={setLocation}
          />

          <TextInput
            style={styles.input}
            placeholder="Skill level (beginner / intermediate / advanced)"
            value={skillLevel}
            onChangeText={setSkillLevel}
          />

          <TextInput
            style={styles.input}
            placeholder="Availability (example: tonight, tomorrow)"
            value={availability}
            onChangeText={setAvailability}
          />

          <Pressable
            style={[styles.button, creatingUser && styles.buttonDisabled]}
            onPress={handleCreateUser}
            disabled={creatingUser}
          >
            <Text style={styles.buttonText}>
              {creatingUser ? 'Creating...' : 'Create User'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={fetchUsers}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Refreshing...' : 'Refresh Users'}
            </Text>
          </Pressable>
        </View>

        {formError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Form Error</Text>
            <Text>{formError}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text>{errorMessage}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>All Users</Text>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text>Location: {item.location}</Text>
              <Text>Interests: {item.interests.join(', ')}</Text>
              <Text>Skill Level: {item.skill_level}</Text>
              <Text>Availability: {item.availability.join(', ')}</Text>
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text>Try refreshing the list.</Text>
              </View>
            ) : null
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  formBox: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: 'black',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBox: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0b4b4',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff5f5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBox: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
});