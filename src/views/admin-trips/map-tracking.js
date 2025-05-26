import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button, Select, Typography, Descriptions, Spin, Space, Tag, message } from 'antd';
import GoogleMapReact from 'google-map-react';
import request from '../../services/request';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

// Map marker components
const VehicleMarker = ({ text, bearing = 0 }) => (
  <div style={{
    transform: `rotate(${bearing}deg)`,
    color: '#1890ff',
    background: '#1890ff',
    border: '2px solid white',
    borderRadius: '50%',
    height: '16px',
    width: '16px',
    position: 'relative',
    zIndex: 999,
  }}>
    <div style={{
      position: 'absolute',
      top: '-20px',
      width: '80px',
      left: '-32px',
      textAlign: 'center',
      color: '#000',
      fontWeight: 'bold',
      background: 'rgba(255,255,255,0.8)',
      padding: '2px',
      borderRadius: '4px',
      fontSize: '12px',
    }}>
      {text}
    </div>
  </div>
);

const StopMarker = ({ text, status = 'pending' }) => {
  const colors = {
    pending: 'orange',
    arrived: 'green',
    skipped: 'red'
  };
  
  return (
    <div style={{
      background: colors[status],
      color: 'white',
      border: '2px solid white',
      borderRadius: '50%',
      height: '24px',
      width: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: '-20px',
        width: '60px',
        left: '-18px',
        textAlign: 'center',
        color: '#000',
        fontWeight: 'bold',
        background: 'rgba(255,255,255,0.8)',
        padding: '2px',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        {text}
      </div>
    </div>
  );
};

// Main component
export default function MapTracking() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTrips, setActiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -6.79, lng: 39.21 });
  const [mapZoom, setMapZoom] = useState(12);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Fetch active trips
  const fetchActiveTrips = useCallback(() => {
    setLoading(true);
    request
      .get('dashboard/admin/trip-tracking/active')
      .then((res) => {
        const trips = res.data?.data || [];
        setActiveTrips(trips);
        
        // If we have a trip ID from the route, select it
        if (id && !selectedTrip) {
          const trip = trips.find(t => t.id === parseInt(id));
          if (trip) {
            setSelectedTrip(trip);
          }
        }
        
        // If no ID from route but we have trips, select the first one
        if (!id && trips.length > 0 && !selectedTrip) {
          setSelectedTrip(trips[0]);
        }
      })
      .catch(() => message.error(t('error.loading.trips')))
      .finally(() => setLoading(false));
  }, [id, selectedTrip, t]);

  // Fetch driver location
  const fetchDriverLocation = useCallback(() => {
    if (!selectedTrip) return;
    
    setLoadingLocation(true);
    request
      .get(`dashboard/admin/trip-tracking/${selectedTrip.id}/location`)
      .then((res) => {
        const location = res.data?.data;
        if (location) {
          setDriverLocation(location);
          
          // Update map center to follow vehicle if auto-center is on
          setMapCenter({ 
            lat: parseFloat(location.lat), 
            lng: parseFloat(location.lng) 
          });
        }
      })
      .catch((err) => console.error('Error fetching location:', err))
      .finally(() => setLoadingLocation(false));
  }, [selectedTrip]);

  // Initial load
  useEffect(() => {
    fetchActiveTrips();
  }, [fetchActiveTrips]);

  // Set up polling for location updates when a trip is selected
  useEffect(() => {
    if (selectedTrip) {
      fetchDriverLocation();
      
      // Clear any existing interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Set up new polling interval - every 5 seconds
      const interval = setInterval(() => {
        fetchDriverLocation();
      }, 5000);
      
      setRefreshInterval(interval);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [selectedTrip, fetchDriverLocation]);

  // Handle trip selection change
  const handleTripChange = (tripId) => {
    const trip = activeTrips.find(t => t.id === tripId);
    setSelectedTrip(trip);
    
    // Update URL without reloading
    navigate(`/trips/tracking/${tripId}`, { replace: true });
  };

  // Handle trip completion
  const handleCompleteTrip = () => {
    if (!selectedTrip) return;
    
    setLoading(true);
    request
      .post(`dashboard/admin/trip-tracking/${selectedTrip.id}/complete`)
      .then(() => {
        message.success(t('trip.marked.completed'));
        fetchActiveTrips();
      })
      .catch(() => message.error(t('error.completing.trip')))
      .finally(() => setLoading(false));
  };

  return (
    <Card 
      title={
        <Space>
          <Button onClick={() => navigate('/trips')}>{t('back.to.trips')}</Button>
          <Title level={4} style={{ margin: 0 }}>{t('live.trip.tracking')}</Title>
        </Space>
      }
      extra={
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder={t('select.active.trip')}
            loading={loading}
            value={selectedTrip?.id}
            onChange={handleTripChange}
          >
            {activeTrips.map(trip => (
              <Option key={trip.id} value={trip.id}>
                {trip.name || `Trip #${trip.id}`}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            danger
            disabled={!selectedTrip}
            onClick={handleCompleteTrip}
          >
            {t('complete.trip')}
          </Button>
        </Space>
      }
    >
      {selectedTrip ? (
        <>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t('trip.id')}>{selectedTrip.id}</Descriptions.Item>
            <Descriptions.Item label={t('driver')}>
              {selectedTrip.driver?.firstname || t('no.driver')}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicle')}>
              {selectedTrip.vehicle?.model || t('no.vehicle')}
            </Descriptions.Item>
            <Descriptions.Item label={t('started')}>
              {selectedTrip.started_at ? dayjs(selectedTrip.started_at).format('HH:mm:ss') : t('not.started')}
            </Descriptions.Item>
            <Descriptions.Item label={t('stops.remaining')}>
              {selectedTrip.locations?.filter(l => l.status === 'pending').length || 0}
            </Descriptions.Item>
            <Descriptions.Item label={t('stops.completed')}>
              {selectedTrip.locations?.filter(l => l.status === 'arrived').length || 0}
            </Descriptions.Item>
          </Descriptions>
          
          <div style={{ height: '500px', width: '100%', position: 'relative' }}>
            <GoogleMapReact
              bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_MAPS_KEY }}
              center={mapCenter}
              zoom={mapZoom}
              onChange={({ center, zoom }) => {
                setMapCenter(center);
                setMapZoom(zoom);
              }}
            >
              {/* Draw start location */}
              <StopMarker
                lat={selectedTrip.start_lat}
                lng={selectedTrip.start_lng}
                text="Start"
                status="arrived"
              />
              
              {/* Draw stop locations */}
              {selectedTrip.locations?.map((loc) => (
                <StopMarker
                  key={loc.id}
                  lat={loc.lat}
                  lng={loc.lng}
                  text={`Stop ${loc.sequence + 1}`}
                  status={loc.status}
                />
              ))}
              
              {/* Draw vehicle marker */}
              {driverLocation && (
                <VehicleMarker
                  lat={driverLocation.lat}
                  lng={driverLocation.lng}
                  text={selectedTrip.driver?.firstname || "Driver"}
                  bearing={driverLocation.bearing}
                />
              )}
            </GoogleMapReact>
            
            {/* Loading overlay */}
            {loadingLocation && (
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(255,255,255,0.8)',
                padding: '5px 10px',
                borderRadius: '4px',
              }}>
                <Spin size="small" /> {t('updating.location')}
              </div>
            )}
          </div>
          
          {/* Show current stats */}
          <div style={{ marginTop: 16 }}>
            <Text strong>{t('stats')}:</Text> {' '}
            {driverLocation ? (
              <Space>
                <Tag color="blue">{t('speed')}: {driverLocation.speed ? `${Math.round(driverLocation.speed * 3.6)} km/h` : t('stationary')}</Tag>
                <Tag color="green">{t('updated')}: {driverLocation.updated_at ? dayjs(driverLocation.updated_at).fromNow() : t('unknown')}</Tag>
              </Space>
            ) : (
              <Text type="secondary">{t('no.live.location')}</Text>
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 50 }}>
          {loading ? (
            <Spin size="large" />
          ) : (
            <Text type="secondary">{t('no.active.trips')}</Text>
          )}
        </div>
      )}
    </Card>
  );
} 