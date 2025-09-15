// src/components/PauseManager.jsx
import { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, orderBy, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// Helper function to generate all the events for the calendar view
const generateCalendarEvents = (client, pauses, orders) => {
  if (!client) return [];
  const events = [];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // If on-demand client, show all single tiffin orders as events
  if (client.customerType === 'ondemand' && Array.isArray(orders) && orders.length > 0) {
    orders.forEach(order => {
      if (order.orderDate && order.mealType) {
        const eventTitle = `Order: ${order.mealType.charAt(0).toUpperCase() + order.mealType.slice(1)}`;
        events.push({ title: eventTitle, start: order.orderDate, color: '#4F46E5', allDay: true });
      }
    });
    return events;
  } else if (client.customerType === 'ondemand' && client.plan?.date && client.plan?.mealType) {
    // fallback: show plan date if no orders found
    const eventTitle = `Order: ${client.plan.mealType.charAt(0).toUpperCase() + client.plan.mealType.slice(1)}`;
    events.push({ title: eventTitle, start: client.plan.date, color: '#4F46E5', allDay: true });
    return events;
  }

  // Subscription logic as before
  if (!client.deliverySchedule) return events;
  const planStartDate = client.plan?.startDate;
  const planEndDate = client.plan?.endDate;
  if (!planStartDate || !planEndDate) return events;

  let current = new Date(planStartDate);
  const end = new Date(planEndDate);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayName = dayNames[current.getDay()];
    if (client.deliverySchedule[dayName]) {
      events.push({ title: 'Delivered', start: dateStr, color: '#10B981', allDay: true });
    } else {
      events.push({ title: 'Skipped', start: dateStr, color: '#6B7280', display: 'background' });
    }
    current.setDate(current.getDate() + 1);
  }

  // 2. Overlay "Paused" events, overwriting the baseline events
  pauses.forEach(pause => {
    const startDate = new Date(pause.startDate + 'T00:00:00Z');
    const endDate = new Date(pause.endDate + 'T00:00:00Z');
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const eventIndex = events.findIndex(e => e.start === dateStr);
      if (eventIndex !== -1) {
        events[eventIndex] = { ...events[eventIndex], title: 'Paused', color: '#F59E0B', display: 'auto' };
      }
    }
  });

  // 3. Overlay "Single Order" events
  if (orders && Array.isArray(orders)) {
    orders.forEach(order => {
      const dateStr = order.orderDate;
      const eventIndex = events.findIndex(e => e.start === dateStr);
      const eventTitle = `Single ${order.mealType ? order.mealType.charAt(0).toUpperCase() + order.mealType.slice(1) : ''}`;
      if (eventIndex !== -1) {
        events[eventIndex] = { ...events[eventIndex], title: `${events[eventIndex].title} + Extra`, color: '#4F46E5' };
      } else {
        events.push({ title: eventTitle, start: dateStr, color: '#4F46E5', allDay: true });
      }
    });
  }

  return events;
};


export default function PauseManager({ client }) {
  const [pauses, setPauses] = useState([]);
  const [orders, setOrders] = useState([]); // NEW state for single orders
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for the "Add Pause" form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mealType, setMealType] = useState('both');

  // Fetches all pause and order documents for the client and regenerates calendar events
  const fetchScheduleData = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      // Fetch pauses
      const pausesQuery = query(collection(db, 'clients', client.id, 'pauses'));
      const ordersQuery = query(collection(db, 'clients', client.id, 'orders'));
      const [pausesSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(pausesQuery),
        getDocs(ordersQuery)
      ]);
      const pausesData = pausesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPauses(pausesData);
      setOrders(ordersData);
      const events = generateCalendarEvents(client, pausesData, ordersData);
      setCalendarEvents(events);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  // Handler for adding a new multi-day pause period via the form
  const handleAddPause = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
      alert("Please select a valid start and end date.");
      return;
    }
    try {
      await addDoc(collection(db, 'clients', client.id, 'pauses'), {
        startDate,
        endDate,
        mealType,
        createdAt: serverTimestamp()
      });
      setStartDate('');
      setEndDate('');
      setMealType('both');
      fetchScheduleData(); // Refresh data
    } catch (error) {
      console.error("Error adding pause period: ", error);
      alert("Failed to add pause period.");
    }
  };

  // Handler for toggling service on a single day by clicking the calendar
  const handleDateClick = async (clickInfo) => {
    const clickedDateStr = clickInfo.dateStr;
    const existingPause = pauses.find(p => clickedDateStr >= p.startDate && clickedDateStr <= p.endDate);

    if (existingPause) {
      if (existingPause.startDate === existingPause.endDate) {
        if (window.confirm(`Resume service for ${clickedDateStr}?`)) {
          await deleteDoc(doc(db, 'clients', client.id, 'pauses', existingPause.id));
          fetchScheduleData(); // Refresh data
        }
      } else {
        alert("To modify a multi-day pause, please use the form.");
      }
    } else {
      if (window.confirm(`Pause service for ${clickedDateStr}?`)) {
        await addDoc(collection(db, 'clients', client.id, 'pauses'), {
          startDate: clickedDateStr,
          endDate: clickedDateStr,
          createdAt: serverTimestamp(),
        });
        fetchScheduleData(); // Refresh data
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Pause Service</h2>
        <form onSubmit={handleAddPause} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium">Start Date</label>
              <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium">End Date</label>
              <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 block w-full input-style" />
            </div>
          </div>
          <div>
            <label htmlFor="mealType" className="block text-sm font-medium">Meal to Pause</label>
            <select id="mealType" value={mealType} onChange={(e) => setMealType(e.target.value)} className="mt-1 block w-full input-style">
              <option value="both">Both Lunch & Dinner</option>
              <option value="lunch">Lunch Only</option>
              <option value="dinner">Dinner Only</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">Add Pause Period</button>
        </form>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Delivery Schedule</h2>
        {loading ? <p>Loading Schedule...</p> : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            dateClick={handleDateClick}
            height="auto"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          />
        )}
      </div>
    </div>
  );
}