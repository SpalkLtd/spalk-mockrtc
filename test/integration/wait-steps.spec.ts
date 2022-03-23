import {
    MockRTC,
    expect,
    waitForState,
    delay,
    waitForChannelOpen
} from '../test-setup';

describe("Wait steps", function () {

    const mockRTC = MockRTC.getRemote();

    beforeEach(() => mockRTC.start());
    afterEach(() => mockRTC.stop());

    it("should be able to wait for a duration before a step", async () => {
        const mockPeer = await mockRTC.buildPeer()
            .sleep(400)
            .thenSend('delayed message');

        const localConnection = new RTCPeerConnection();

        const receivedMessages: string[] = [];
        const testChannel = localConnection.createDataChannel('data-channel');
        testChannel.addEventListener('message', (event) => { receivedMessages.push(event.data) });

        const localOffer = await localConnection.createOffer();
        await localConnection.setLocalDescription(localOffer);
        const mockAnswer = await mockPeer.answerOffer(localOffer);
        await localConnection.setRemoteDescription(mockAnswer);

        await waitForState(localConnection, 'connected');

        await delay(200);
        expect(receivedMessages).to.deep.equal([]);

        await delay(300);
        expect(receivedMessages).to.deep.equal(['delayed message']);
    });

    it("should be able to wait for a message on any channel", async () => {
        const mockPeer = await mockRTC.buildPeer()
            .waitForMessage()
            .thenSend('delayed message');

        const localConnection = new RTCPeerConnection();

        const receivedMessages: string[] = [];
        const testChannel = localConnection.createDataChannel('data-channel');
        testChannel.addEventListener('message', (event) => { receivedMessages.push(event.data) });

        const localOffer = await localConnection.createOffer();
        await localConnection.setLocalDescription(localOffer);
        const mockAnswer = await mockPeer.answerOffer(localOffer);
        await localConnection.setRemoteDescription(mockAnswer);

        await waitForState(localConnection, 'connected');

        await delay(100);
        expect(receivedMessages).to.deep.equal([]);

        testChannel.send('test message');
        await delay(100);
        expect(receivedMessages).to.deep.equal(['delayed message']);
    });

    it("should be able to wait for a message on a specific channel", async () => {
        const mockPeer = await mockRTC.buildPeer()
            .waitForMessageOnChannel("message-channel")
            .thenSend('delayed message');

        const localConnection = new RTCPeerConnection();

        const receivedMessages: string[] = [];
        const ignoredChannel = localConnection.createDataChannel('ignored-channel');
        const messageChannel = localConnection.createDataChannel('message-channel');
        messageChannel.addEventListener('message', (event) => { receivedMessages.push(event.data) });

        const localOffer = await localConnection.createOffer();
        await localConnection.setLocalDescription(localOffer);
        const mockAnswer = await mockPeer.answerOffer(localOffer);
        await localConnection.setRemoteDescription(mockAnswer);

        await waitForState(localConnection, 'connected');

        await waitForChannelOpen(ignoredChannel);
        ignoredChannel.send('test message');
        await delay(100);
        expect(receivedMessages).to.deep.equal([]);

        messageChannel.send('test message');
        await delay(100);
        expect(receivedMessages).to.deep.equal(['delayed message']);
    });

});