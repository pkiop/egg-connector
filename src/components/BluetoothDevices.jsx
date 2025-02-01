import { useState, useEffect } from 'react';

export function BluetoothDevices() {
  const [device, setDevice] = useState([]);
  const [brainwaveData, setBrainwaveData] = useState(null);
  const [characteristics, setCharacteristics] = useState([]);
  const [characteristic, setCharacteristic] = useState();

  useEffect(() => {
    const ws = new WebSocket('ws://220.92.133.66:3000');

    setInterval(() => {
      const eeg = [];
      for (let i = 0; i < 6; i++) {
        eeg.push(Math.random().toFixed(4) * 30 - 15);
      }
      ws.send(JSON.stringify({ eeg: eeg }));
    }, 1000);
    return () => {
      ws.close();
    };
  }, []);

  const handleCharacteristicValueChanged = (event) => {
    const value = event.target.value;
    const brainwaveValue = value.getUint8(0);
    setBrainwaveData(brainwaveValue);
    console.log('brainwaveData', brainwaveValue);

    // if (websocket && websocket.readyState === WebSocket.OPEN) {
    //   websocket.send(JSON.stringify({ brainwaveData: brainwaveValue }));
    // }
  };

  useEffect(() => {
    if (characteristic) {
      console.log('characteristic connected');
      console.log(characteristic.properties);
      if (characteristic.properties.notify) {
        characteristic.addEventListener(
          'characteristicvaluechanged',
          handleCharacteristicValueChanged
        );
        characteristic.startNotifications();
      }
    }
  }, [characteristic]);

  const handleScan = async () => {
    try {
      console.log('scan start');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'],
      });

      const server = await device.gatt.connect();
      console.log('server connected');
      const services = await server.getPrimaryServices();
      console.log('primary services connected');
      console.log(services);
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        console.log(characteristics);
        console.log('characteristics[0] : ', characteristics[0]);
        setCharacteristics(characteristics);
      }

      setDevice(device);
    } catch (error) {
      console.error('Error scanning for Bluetooth devices:', error);
    }
  };

  return (
    <div>
      <h1>Bluetooth Devices</h1>
      <button onClick={handleScan}>Scan for Devices</button>
      <div>
        <h3>선택된 장비</h3>
        {device && <div>{device.name || 'Unnamed Device'}</div>}
      </div>

      <div>
        <h3>장비 기능 목록</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {characteristics.map((characteristic, index) => (
            <button
              key={index}
              onClick={() => {
                setCharacteristic(characteristic);
              }}
            >
              {characteristic.uuid || 'Unnamed Service'}
              {characteristic.properties.notify ? '🔔' : ''}
            </button>
          ))}
        </div>
      </div>
      {characteristic && (
        <div>
          <div>선택된 기능</div>
          <div>{characteristic.uuid || 'Unnamed Service'}</div>
        </div>
      )}

      <div>
        <h3>장비에서 전송한 데이터</h3>
        {brainwaveData !== null && (
          <p>Brainwave Data: {JSON.stringify(brainwaveData)}</p>
        )}
      </div>
    </div>
  );
}
