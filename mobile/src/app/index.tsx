import { API_BASE_URL } from '@/constants/api';
import { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';

type MatchResult = {
  user: User;
  score: number;
};

type ParsedPrompt = {
  activity: string | null;
  location: string | null;
  skill_level: string | null;
  availability: string | null;
  group_size: number | null;
};

type MatchSummary = {
  requested_people: number;
  found_people: number;
};

type User = {
  id: number;
  name: string;
  interests: string[];
  location: string;
  skill_level: string;
  availability: string[];
};

export default function HomeScreen() {
  const [prompt, setPrompt] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [parsedPrompt, setParsedPrompt] = useState<ParsedPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<User[]>([]);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);
      setErrorMessage(null);
      setSelectedGroup([]);
      setMatches([]);
      setParsedPrompt(null);
      setMatchSummary(null);

      const response = await fetch(`${API_BASE_URL}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Backend request failed');
      }

      const data = await response.json();
      setSelectedGroup(data.selected_group);
      setMatches(data.matches);
      setParsedPrompt(data.parsed_prompt);
      setMatchSummary({
        requested_people: data.requested_people,
        found_people: data.found_people,
      });
    } catch (error) {
      setSelectedGroup([]);
      setMatches([]);
      setParsedPrompt(null);
      setMatchSummary(null);
      setErrorMessage('Something went wrong. Please try again.');
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Agent Match</Text>
      <Text style={styles.subtitle}>Describe what you want to do.</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: I want basketball in Monastiraki"
        value={prompt}
        onChangeText={setPrompt}
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSearch}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Searching...' : 'Find Matches'}
        </Text>
      </Pressable>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text>{errorMessage}</Text>
        </View>
      )}

        {parsedPrompt && (
          <View style={styles.parsedBox}>
            <Text style={styles.parsedTitle}>Parsed Intent</Text>
            <Text>Activity: {parsedPrompt.activity ?? 'None'}</Text>
            <Text>Location: {parsedPrompt.location ?? 'None'}</Text>
            <Text>Skill Level: {parsedPrompt.skill_level ?? 'None'}</Text>
            <Text>Availability: {parsedPrompt.availability ?? 'None'}</Text>
            <Text>Group Size: {parsedPrompt.group_size ?? 'None'}</Text>
        </View>
      )}

      {matchSummary && (
        <View style={styles.parsedBox}>
          <Text style={styles.parsedTitle}>Group Summary</Text>
          <Text>Requested People: {matchSummary.requested_people}</Text>
          <Text>Found People: {matchSummary.found_people}</Text>
          {matchSummary.found_people < matchSummary.requested_people && (
            <Text style={styles.warningText}>Not enough strong matches yet.</Text>
          )}
        </View>
      )}

      {selectedGroup.length > 0 && (
        <View style={styles.parsedBox}>
          <Text style={styles.parsedTitle}>Suggested Group</Text>
          {selectedGroup.map((user) => (
            <View key={user.id} style={styles.card}>
              <Text style={styles.name}>{user.name}</Text>
              <Text>Location: {user.location}</Text>
              <Text>Interests: {user.interests.join(', ')}</Text>
              <Text>Skill Level: {user.skill_level}</Text>
              <Text>Availability: {user.availability.join(', ')}</Text>
            </View>
          ))}
        </View>
      )}

      {hasSearched && !loading && !errorMessage && matches.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text>Try a different activity or location.</Text>
        </View>
      )}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.user.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.user.name}</Text>
            <Text>Location: {item.user.location}</Text>
            <Text>Interests: {item.user.interests.join(', ')}</Text>
            <Text>Skill Level: {item.user.skill_level}</Text>
            <Text>Availability: {item.user.availability.join(', ')}</Text>
            <Text>Score: {item.score}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    marginBottom: 20,
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
  parsedBox: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#f7f7f7',
  },
  parsedTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningText: {
    marginTop: 8,
    fontWeight: '600',
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
  },
});
