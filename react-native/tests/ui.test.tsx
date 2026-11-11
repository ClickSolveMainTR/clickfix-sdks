import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { ClickFixProvider } from '../src/index';
import { ChatScreen, ClickFixThemeProvider, ConversationListScreen, PreChatForm, darkTheme, fieldVisible, labelsTr, missingFields } from '../src/ui/index';
import { createStub } from './stub';

const app = (stub: ReturnType<typeof createStub>, ui: React.ReactElement) => (
  <ClickFixProvider appKey="cf_app_test" packageName="com.example.app" widgetId="w" baseUrl="https://support.example.test" fetch={stub.fetch}>
    {ui}
  </ClickFixProvider>
);

test('ConversationListScreen lists conversations with unread badges and opens one', async () => {
  const stub = createStub();
  const uuid = stub.seed(3);
  const onOpen = jest.fn();
  const onNew = jest.fn();
  const screen = await render(app(stub, <ConversationListScreen onOpen={onOpen} onNew={onNew} labels={labelsTr} theme={darkTheme} />));
  const row = await screen.findByTestId(`clickfix-conversation-${uuid}`);
  expect(within(row).getByText('1')).toBeTruthy(); // one unread agent reply
  expect(within(row).getByText(/m3/)).toBeTruthy();
  await fireEvent.press(row);
  expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ uuid }));
  await fireEvent.press(screen.getByText('Yeni konuşma'));
  expect(onNew).toHaveBeenCalled();
});

test('ChatScreen shows messages, sends, marks read and shows the typing indicator and rating', async () => {
  const stub = createStub();
  const uuid = stub.seed(2);
  const screen = await render(app(stub, <ChatScreen conversation={uuid} pollMs={0} />));
  await screen.findByText('m2');
  await waitFor(() => expect(stub.calls.some((c) => c.path === `/conversations/${uuid}/read`)).toBe(true));
  await fireEvent.changeText(screen.getByTestId('clickfix-composer'), 'Merhaba');
  await fireEvent.press(screen.getByTestId('clickfix-send'));
  await screen.findByText('Merhaba');
  expect(stub.calls.filter((c) => c.path === `/conversations/${uuid}/messages` && c.method === 'POST')).toHaveLength(1);
  expect(stub.calls.some((c) => c.path === `/conversations/${uuid}/typing`)).toBe(true);

  stub.resolve(uuid);
  // The next refresh (reload) brings can_rate; trigger it via a realtime-less path: remount.
  await screen.unmount();
  const resolved = await render(app(stub, <ChatScreen conversation={uuid} pollMs={0} />));
  await resolved.findByTestId('clickfix-rating');
  expect(resolved.queryByTestId('clickfix-composer')).toBeNull();
  await fireEvent.press(resolved.getByTestId('clickfix-rate-4'));
  await waitFor(() => expect(stub.calls.at(-1)!.path).toBe(`/conversations/${uuid}/rating`));
  await resolved.findByText('Thank you for your feedback.');
  expect(stub.calls.at(-1)!.body).toEqual({ score: 4, comment: '' });
});

test('ChatScreen starts a new conversation through the start form and reports the created id', async () => {
  const stub = createStub({ requestForm: true });
  const onCreated = jest.fn();
  const pickFile = jest.fn(async () => ({ uri: 'file:///p.png', name: 'p.png', type: 'image/png' }));
  const screen = await render(
    app(
      stub,
      <ClickFixThemeProvider labels={labelsTr}>
        <ChatScreen conversation={null} onCreated={onCreated} pickFile={pickFile} requireConsent pollMs={0} />
      </ClickFixThemeProvider>,
    ),
  );
  await screen.findByTestId('clickfix-start-form');
  expect(screen.queryByTestId('clickfix-field-order')).toBeNull(); // hidden until topic = billing
  await fireEvent.press(screen.getByTestId('clickfix-form-submit'));
  expect(screen.getByText('Bu alan zorunludur.')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('clickfix-field-topic-billing'));
  await fireEvent.changeText(screen.getByTestId('clickfix-field-order'), 'S-1');
  await fireEvent(screen.getByTestId('clickfix-consent'), 'valueChange', true);
  await fireEvent.press(screen.getByTestId('clickfix-form-submit'));
  await screen.findByTestId('clickfix-composer');
  await fireEvent.changeText(screen.getByTestId('clickfix-composer'), 'Faturam yanlış');
  await fireEvent.press(screen.getByTestId('clickfix-send'));
  await screen.findByText('Faturam yanlış');
  const create = stub.calls.find((c) => c.method === 'POST' && c.path === '/conversations')!;
  expect(create.body).toMatchObject({ text: 'Faturam yanlış', form: { form_uuid: 'form-1', values: { topic: 'billing', order: 'S-1' } }, consent: true });
  await waitFor(() => expect(onCreated).toHaveBeenCalledWith(stub.conversations[0]!.uuid));
  await act(async () => {
    await fireEvent.press(screen.getByTestId('clickfix-attach'));
  });
  await waitFor(() => expect(stub.calls.some((c) => c.path.endsWith('/messages') && (c.body as { file?: { name: string } } | undefined)?.file?.name === 'p.png')).toBe(true));
});

test('form helpers evaluate conditions and required fields', async () => {
  const field = (key: string, extra: Partial<Parameters<typeof fieldVisible>[0]> = {}) =>
    ({ key, source: 'conversation', type: 'text', label: key, help: '', required: true, options: [], placeholder: '', condition: null, ...extra }) as Parameters<typeof fieldVisible>[0];
  expect(fieldVisible(field('a', { condition: { field: 'b', operator: 'is_set' } }), {})).toBe(false);
  expect(fieldVisible(field('a', { condition: { field: 'b', operator: 'in', value: ['x', 'y'] } }), { b: 'y' })).toBe(true);
  expect(fieldVisible(field('a', { condition: { field: 'b', operator: 'not_equals', value: 'x' } }), { b: 'x' })).toBe(false);
  const form = { uuid: 'f', name: '', description: '', fields: [field('a'), field('b', { type: 'boolean' }), field('c', { condition: { field: 'a', operator: 'equals', value: 'go' } })] };
  expect(missingFields(form, {})).toEqual(['a', 'b']);
  expect(missingFields(form, { a: 'go', b: true })).toEqual(['c']);
  expect(missingFields(form, { a: 'stop', b: true })).toEqual([]);
  const screen = await render(<PreChatForm form={form} onSubmit={() => undefined} />);
  expect(screen.getByText('a *')).toBeTruthy();
});
