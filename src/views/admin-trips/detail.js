import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Table, Tag, message, Space, Spin } from 'antd';
import request from '../../services/request';
import GoogleMapReact from 'google-map-react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const Marker = ({ text, color = 'red' }) => (
  <div style={{ 
    background: color, 
    color: 'white', 
    borderRadius: '50%', 
    width: '22px', 
    height: '22px', 
    textAlign: 'center', 
    lineHeight: '22px',
    fontWeight: 'bold',
    border: '2px solid white',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
  }}>
    {text}
  </div>
);

// Polyline component for routes
const RoutePolyline = ({ map, maps, route, color }) => {
  const validProps = map !== null && maps !== null && route !== null;

  React.useEffect(() => {
    if (!validProps) return;
    
    const path = route.map(point => ({
      lat: parseFloat(point.lat),
      lng: parseFloat(point.lng)
    }));
    
    const polyline = new maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 4
    });
    
    polyline.setMap(map);
    
    return () => {
      polyline.setMap(null);
    };
  }, [map, maps, route, color, validProps]);

  return null;
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [trip, setTrip] = useState(null);
  const [routeLines, setRouteLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOptimized, setShowOptimized] = useState(true);
  const [mapObj, setMapObj] = useState({ map: null, maps: null });

  const fetch = () => {
    setLoading(true);
    request
      .get(`dashboard/admin/trips/${id}`)
      .then((res) => {
        const data = res.data?.data || {};
        if (data.trip) {
          setTrip(data.trip);
          setRouteLines(data.route_lines || []);
        } else {
          message.error(t('invalid.trip.data'));
        }
      })
      .catch((err) => {
        console.error('Error fetching trip details:', err);
        message.error(t('something.went.wrong'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) {
      fetch();
    }
  }, [id]);

  if (loading) {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!trip) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('trip.not.found')}</p>
          <Button onClick={() => navigate('/trips')}>{t('back.to.trips')}</Button>
        </div>
      </Card>
    );
  }

  const columns = [
    { title: t('seq'), dataIndex: 'sequence', key: 'sequence' },
    { title: t('address'), dataIndex: 'address', key: 'address' },
    { 
      title: t('status'), 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'orange',
          arrived: 'green',
          skipped: 'red'
        };
        return <Tag color={colors[status] || 'blue'}>{status}</Tag>;
      }
    },
    {
      title: t('arrived_at'),
      dataIndex: 'arrived_at',
      key: 'arrived_at',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  const start = { lat: parseFloat(trip.start_lat), lng: parseFloat(trip.start_lng) };
  
  const toggleOptimizationView = () => {
    setShowOptimized((prev) => !prev);
  };

  const handleOptimize = () => {
    setLoading(true);
    request
      .post(`dashboard/admin/trips/${trip.id}/optimize`)
      .then(() => {
        message.success(t('optimized.successfully'));
        fetch();
      })
      .catch(() => message.error(t('something.went.wrong')))
      .finally(() => setLoading(false));
  };

  // Create array of path coordinates for the polyline
  const routePath = [];
  if (trip) {
    // Add start point
    routePath.push(start);
    
    // Add all locations in sequence
    const locations = trip.locations || [];
    locations.forEach(loc => {
      routePath.push({ 
        lat: parseFloat(loc.lat), 
        lng: parseFloat(loc.lng) 
      });
    });
  }

  const handleApiLoaded = (map, maps) => {
    setMapObj({ map, maps });
  };

  return (
    <Card
      title={
        <Space>
          <Button onClick={() => navigate('/trips')}>{t('back')}</Button>
          {trip.name || `#${trip.id}`}
          <Button type='primary' onClick={handleOptimize}>{t('optimize.trip.again')}</Button>
          <Button onClick={toggleOptimizationView}>
            {showOptimized ? t('show.original') : t('show.optimized')}
          </Button>
        </Space>
      }
      loading={loading}
    >
      <Descriptions bordered column={2} size='small'>
        <Descriptions.Item label={t('driver')}>{trip.driver?.firstname || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('vehicle')}>{trip.vehicle?.model || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('status')}>
          <Tag color={trip.status === 'completed' ? 'green' : (trip.status === 'in_progress' ? 'blue' : 'orange')}>
            {trip.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('optimized')}>
          {trip.meta?.optimized_at ? (
            <Tag color='green'>{dayjs(trip.meta.optimized_at).format('YYYY-MM-DD HH:mm')}</Tag>
          ) : (
            <Tag color='orange'>{t('no')}</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t('created_at')}>{dayjs(trip.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label={t('stops')}>{trip.locations ? trip.locations.length : 0}</Descriptions.Item>
      </Descriptions>

      <div style={{ height: '500px', width: '100%', marginTop: 16, position: 'relative' }}>
        <GoogleMapReact
          bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_MAPS_KEY }}
          defaultCenter={start}
          defaultZoom={12}
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
        >
          {/* Start marker */}
          <Marker
            lat={start.lat}
            lng={start.lng}
            text="S"
            color="green"
          />
          
          {/* Location markers */}
          {trip.locations && trip.locations.map((loc, idx) => (
            <Marker
              key={loc.id}
              lat={loc.lat}
              lng={loc.lng}
              text={idx + 1}
              color={loc.status === 'arrived' ? 'green' : (loc.status === 'skipped' ? 'red' : 'orange')}
            />
          ))}
        </GoogleMapReact>
        
        {/* Draw polylines if map is loaded */}
        {mapObj.map && mapObj.maps && (
          <RoutePolyline
            map={mapObj.map}
            maps={mapObj.maps}
            route={routePath}
            color="#3388ff"
          />
        )}
      </div>

      <Table
        rowKey='id'
        columns={columns}
        dataSource={trip.locations}
        pagination={false}
        style={{ marginTop: 24 }}
      />
    </Card>
  );
} 