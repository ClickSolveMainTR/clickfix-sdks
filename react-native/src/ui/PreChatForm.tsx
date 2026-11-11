// The widget's start form (CF-52 request forms) rendered natively: the
// field list comes from bootstrap.request_form; conditions hide fields the
// same way the web widget does. Submit returns the values keyed by field
// key, ready for `send({ form: { form_uuid, values } })`.
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { components } from '@getclickfix/visitor-core';
import { useClickFixUI, type ClickFixTheme, type ThemeProps } from './theme.js';

export type RequestForm = components['schemas']['PublicRequestForm'];
export type RequestFormField = components['schemas']['PublicRequestFormField'];
export type FormValues = Record<string, unknown>;

export interface PreChatFormProps extends ThemeProps {
  form: RequestForm;
  /** Ask for the GDPR/KVKK consent checkbox (sent as `consent`). */
  requireConsent?: boolean;
  initialValues?: FormValues;
  onSubmit: (values: FormValues, consent: boolean) => void | Promise<void>;
  submitting?: boolean;
  testID?: string;
}

/** Whether a field is shown, given the other values (mirrors the widget). */
export function fieldVisible(field: RequestFormField, values: FormValues): boolean {
  const c = field.condition;
  if (!c) return true;
  const v = values[c.field];
  const set = v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
  switch (c.operator) {
    case 'is_set':
      return set;
    case 'is_not_set':
      return !set;
    case 'equals':
      return set && String(v) === String(c.value);
    case 'not_equals':
      return !set || String(v) !== String(c.value);
    case 'in':
      return set && Array.isArray(c.value) && c.value.map(String).includes(String(v));
    default:
      return true;
  }
}

/** Keys of required, visible fields that are empty. */
export function missingFields(form: RequestForm, values: FormValues): string[] {
  return form.fields
    .filter((f) => f.required && fieldVisible(f, values))
    .filter((f) => {
      const v = values[f.key];
      return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) || (f.type === 'boolean' && v !== true);
    })
    .map((f) => f.key);
}

export function PreChatForm(props: PreChatFormProps) {
  const { theme, labels } = useClickFixUI(props);
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [values, setValues] = useState<FormValues>(props.initialValues ?? {});
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const set = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }));
  const missing = missingFields(props.form, values);
  const blocked = missing.length > 0 || (props.requireConsent && !consent) || props.submitting;

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    const visible: FormValues = {};
    for (const f of props.form.fields) if (fieldVisible(f, values) && values[f.key] !== undefined && values[f.key] !== '') visible[f.key] = values[f.key];
    void props.onSubmit(visible, consent);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" testID={props.testID}>
      <Text style={styles.title}>{props.form.name || labels.formTitle}</Text>
      {props.form.description ? <Text style={styles.muted}>{props.form.description}</Text> : null}
      {props.form.fields.filter((f) => fieldVisible(f, values)).map((f) => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>{`${f.label}${f.required ? ' *' : ''}`}</Text>
          {renderInput(f, values[f.key], (v) => set(f.key, v), styles, theme, labels)}
          {f.help ? <Text style={styles.help}>{f.help}</Text> : null}
          {touched && missing.includes(f.key) ? <Text style={styles.errorText}>{labels.formRequired}</Text> : null}
        </View>
      ))}
      {props.requireConsent ? (
        <View style={styles.switchRow}>
          <Switch value={consent} onValueChange={setConsent} trackColor={{ true: theme.colors.primary }} testID="clickfix-consent" />
          <Text style={[styles.label, styles.switchLabel]}>{labels.consent}</Text>
        </View>
      ) : null}
      <Pressable onPress={submit} accessibilityRole="button" style={({ pressed }) => [styles.button, (pressed || blocked) && styles.disabled]} testID="clickfix-form-submit">
        <Text style={styles.buttonText}>{labels.formStart}</Text>
      </Pressable>
    </ScrollView>
  );
}

function renderInput(
  f: RequestFormField,
  value: unknown,
  set: (v: unknown) => void,
  styles: ReturnType<typeof makeStyles>,
  theme: ClickFixTheme,
  labels: { yes: string; no: string },
) {
  const text = (keyboard: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url', multiline = false) => (
    <TextInput
      value={value === undefined || value === null ? '' : String(value)}
      onChangeText={(t) => set(f.type === 'number' || f.type === 'money' ? (t === '' ? '' : Number.isNaN(Number(t)) ? t : Number(t)) : t)}
      placeholder={f.placeholder}
      placeholderTextColor={theme.colors.muted}
      keyboardType={keyboard}
      autoCapitalize={keyboard === 'email-address' || keyboard === 'url' ? 'none' : 'sentences'}
      multiline={multiline}
      style={[styles.input, multiline && styles.textarea]}
      testID={`clickfix-field-${f.key}`}
    />
  );
  switch (f.type) {
    case 'textarea':
      return text('default', true);
    case 'number':
    case 'money':
      return text('numeric');
    case 'email':
      return text('email-address');
    case 'phone':
      return text('phone-pad');
    case 'url':
      return text('url');
    case 'boolean':
      return (
        <View style={styles.switchRow}>
          <Switch value={value === true} onValueChange={set} trackColor={{ true: theme.colors.primary }} testID={`clickfix-field-${f.key}`} />
          <Text style={[styles.label, styles.switchLabel]}>{value === true ? labels.yes : labels.no}</Text>
        </View>
      );
    case 'select':
    case 'multiselect': {
      const multi = f.type === 'multiselect';
      const selected = multi ? (Array.isArray(value) ? (value as string[]) : []) : value === undefined ? [] : [String(value)];
      return (
        <View style={styles.options}>
          {f.options
            .filter((o) => !o.archived)
            .map((o) => {
              const on = selected.includes(o.value);
              return (
                <Pressable
                  key={o.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => (multi ? set(on ? selected.filter((v) => v !== o.value) : [...selected, o.value]) : set(on ? '' : o.value))}
                  style={[styles.option, on && styles.optionOn]}
                  testID={`clickfix-field-${f.key}-${o.value}`}
                >
                  <Text style={[styles.optionText, on && styles.optionTextOn]}>{o.label}</Text>
                </Pressable>
              );
            })}
        </View>
      );
    }
    default:
      // text, date (ISO text; wire your own date picker through initialValues/onSubmit if you need one), user
      return text('default');
  }
}

const makeStyles = (t: ClickFixTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: t.spacing },
    title: { color: t.colors.text, fontSize: t.fontSize + 3, fontWeight: '700', marginBottom: 4, fontFamily: t.fontFamily },
    muted: { color: t.colors.muted, fontSize: t.fontSize - 1, marginBottom: t.spacing, fontFamily: t.fontFamily },
    field: { marginBottom: t.spacing },
    label: { color: t.colors.text, fontSize: t.fontSize - 1, fontWeight: '600', marginBottom: 6, fontFamily: t.fontFamily },
    help: { color: t.colors.muted, fontSize: t.fontSize - 3, marginTop: 4, fontFamily: t.fontFamily },
    errorText: { color: t.colors.danger, fontSize: t.fontSize - 3, marginTop: 4, fontFamily: t.fontFamily },
    input: { borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius, padding: t.spacing * 0.75, color: t.colors.text, backgroundColor: t.colors.surface, fontSize: t.fontSize, fontFamily: t.fontFamily },
    textarea: { minHeight: 90, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: t.spacing },
    switchLabel: { marginLeft: t.spacing, marginBottom: 0, flex: 1 },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: t.colors.surface },
    optionOn: { borderColor: t.colors.primary, backgroundColor: t.colors.primary },
    optionText: { color: t.colors.text, fontSize: t.fontSize - 1, fontFamily: t.fontFamily },
    optionTextOn: { color: t.colors.onPrimary },
    button: { padding: t.spacing, borderRadius: t.radius, backgroundColor: t.colors.primary, alignItems: 'center', marginTop: t.spacing / 2 },
    disabled: { opacity: 0.6 },
    buttonText: { color: t.colors.onPrimary, fontSize: t.fontSize, fontWeight: '600', fontFamily: t.fontFamily },
  });
