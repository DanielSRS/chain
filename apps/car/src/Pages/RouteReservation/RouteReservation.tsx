import React, { useState } from 'react';
import { Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { View } from '../../../../shared/index.js';
import { mqttHelpers } from '../../api/mqtt-helpers.js';
import { SharedData } from '../../store/shared-data.js';
import { use$ } from '@legendapp/state/react';

const FLEX1 = { flexBasis: 0, flexGrow: 1, flexShrink: 1 } as const;

interface RouteReservationProps {
  onGoBack: () => void;
}

export function RouteReservation(props: RouteReservationProps) {
  const { onGoBack } = props;
  const car = use$(SharedData.car);
  const [selectedStations, setSelectedStations] = useState<number[]>([]);
  const [reservationResult, setReservationResult] = useState<string>('');
  const [isReserving, setIsReserving] = useState(false);

  // Sample stations for testing - in production these would come from the server
  const availableStations = [
    { id: 2, name: 'Station 2 - Feira de Santana' },
    { id: 12, name: 'Station 12 - Feira de Santana' },
    { id: 3, name: 'Station 3 - Salvador' },
    { id: 4, name: 'Station 4 - Camaçari' },
  ];

  useInput((input, key) => {
    if (key.backspace || input === 'b') {
      onGoBack();
    }
  });

  const toggleStation = (stationId: number) => {
    setSelectedStations(prev =>
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId],
    );
  };

  const reserveRoute = async () => {
    if (!car || selectedStations.length === 0) {
      setReservationResult('❌ No car data or stations selected');
      return;
    }

    setIsReserving(true);
    setReservationResult('🔄 Processing atomic reservation...');

    try {
      const startTime = Date.now();
      const estimatedStopTimes = selectedStations.map(
        (_, index) => startTime + (index + 1) * 60 * 60 * 1000, // 1 hour apart
      );

      const response = await mqttHelpers.reserveMultipleStations({
        stationIds: selectedStations,
        userId: car.id,
        startTime,
        estimatedStopTimes,
      });

      if (response.type === 'success') {
        if ('success' in response.data && response.data.success) {
          const result = response.data.data;
          if (result.success && result.reservationIds) {
            setReservationResult(
              `✅ Successfully reserved ${selectedStations.length} stations!\n` +
                `Reservation IDs: ${result.reservationIds.join(', ')}\n` +
                `Message: ${result.message}`,
            );
          } else {
            setReservationResult(`❌ Reservation failed: ${result.message}`);
          }
        } else {
          setReservationResult(
            `❌ Server error: ${JSON.stringify(response.data)}`,
          );
        }
      } else {
        // Handle specific error types
        const hasError = 'error' in response && response.error;
        const errorType =
          hasError &&
          typeof response.error === 'object' &&
          response.error !== null &&
          'type' in response.error
            ? (response.error as { type: string }).type
            : null;

        if (errorType === 'timeout') {
          setReservationResult(
            '⏱️ Request timed out - This might happen if:\n' +
              '• The server is processing a complex blockchain operation\n' +
              '• MQTT broker connection is slow\n' +
              '• Server is not subscribed to reserveMultipleStations topic\n' +
              'Please try again or check server logs.',
          );
        } else if (errorType === 'not_connected') {
          setReservationResult(
            '🔌 MQTT client not connected\n' +
              'Please check the MQTT broker connection.',
          );
        } else {
          setReservationResult(
            `❌ Request failed: ${response.message || 'Unknown error'}`,
          );
        }
      }
    } catch (error) {
      setReservationResult(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <View style={FLEX1}>
      <View style={{ backgroundColor: 'blue', padding: 1 }}>
        <Text color="white">🛣️ Atomic Route Reservation</Text>
        <Text color="white">Press 'b' to go back</Text>
      </View>

      <View style={{ padding: 1 }}>
        <Text>👤 User: {car?.id}</Text>
        <Text>
          🎯 Selected Stations:{' '}
          {selectedStations.length > 0 ? selectedStations.join(', ') : 'None'}
        </Text>
      </View>

      <View style={{ borderStyle: 'round', padding: 1 }}>
        <Text>📍 Available Stations (Toggle to select):</Text>
        <>
          {availableStations.map(station => (
            <Text key={station.id}>
              {selectedStations.includes(station.id) ? '✅' : '⭕'}{' '}
              {station.name}
            </Text>
          ))}
        </>
      </View>

      <SelectInput
        items={[
          ...availableStations.map(station => ({
            label: `${selectedStations.includes(station.id) ? 'Remove' : 'Add'} ${station.name}`,
            value: `toggle-${station.id}`,
          })),
          ...(selectedStations.length > 0 && !isReserving
            ? [
                {
                  label: '🚀 Reserve Selected Route',
                  value: 'reserve',
                },
              ]
            : []),
          ...(selectedStations.length > 0
            ? [
                {
                  label: '🔄 Clear Selection',
                  value: 'clear',
                },
              ]
            : []),
          {
            label: '⬅️  Go Back',
            value: 'back',
          },
        ]}
        onSelect={item => {
          if (item.value === 'reserve') {
            reserveRoute();
          } else if (item.value === 'clear') {
            setSelectedStations([]);
            setReservationResult('');
          } else if (item.value === 'back') {
            onGoBack();
          } else if (item.value.startsWith('toggle-')) {
            const parts = item.value.split('-');
            const stationIdStr = parts[1];
            if (stationIdStr) {
              const stationId = parseInt(stationIdStr);
              toggleStation(stationId);
            }
          }
        }}
      />

      {reservationResult !== '' ? (
        <View style={{ borderStyle: 'round', padding: 1, marginTop: 1 }}>
          <Text>📋 Result:</Text>
          <>
            {reservationResult.split('\n').map((line, index) => (
              <Text key={index}>{line}</Text>
            ))}
          </>
        </View>
      ) : (
        <></>
      )}
    </View>
  );
}
