document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("calendar");
  const legendItems = document.querySelectorAll(".legend-item");

  const calendarConfigs = [
    { file: "calendar1.ics", color: "#CC4055" },
    { file: "calendar2.ics", color: "#83d6d3" },
    { file: "calendar3.ics", color: "#2d6bb3" },
    { file: "calendar4.ics", color: "#549665" }
  ];

  // Track which calendars are currently active
  let activeCalendars = calendarConfigs.map(c => c.file);
  let allEvents = [];

  // 1. Load all events once and tag them with their source file
  for (let config of calendarConfigs) {
    const response = await fetch(config.file);
    const text = await response.text();
    const jcalData = ICAL.parse(text);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    vevents.forEach(v => {
      const event = new ICAL.Event(v);
      const loc = v.getFirstPropertyValue('location') || '';
      
      const eventData = {
        title: event.summary,
        start: event.startDate.toJSDate(),
        end: event.endDate ? event.endDate.toJSDate() : null,
        allDay: event.startDate.isDate,
        backgroundColor: config.color,
        borderColor: config.color,
        location: loc,
        sourceFile: config.file // custom property for filtering
      };

      allEvents.push(eventData);

      if (event.isRecurring()) {
        const expand = new ICAL.RecurExpansion({ component: v, dtstart: event.startDate });
        let next; let count = 0;
        while ((next = expand.next()) && count < 200) {
          allEvents.push({
            ...eventData,
            start: next.toJSDate(),
            end: event.duration ? new Date(next.toJSDate().getTime() + event.duration.toSeconds() * 1000) : null,
          });
          count++;
        }
      }
    });
  }

  // 2. Initialize Calendar with a function-based event source for dynamic filtering
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridDay",
    slotMinTime: "08:00:00", 
    slotMaxTime: "18:00:00",
    weekends: false,
    headerToolbar: { left: "prev today next", center: "title", right: "timeGridDay timeGridWeek" },
    buttonText: { timeGridDay: "Day", timeGridWeek: "Week" },
    height: "auto",
    nowIndicator: true,
    dayHeaderFormat: {weekday: 'short', day: 'numeric'},
    eventContent: function(arg) {
      let loc = arg.event.extendedProps.location || '';
      return { html: '<b>' + arg.event.title + '</b>' + (loc ? '<br/>' + loc : '') };
    },
    // This function runs every time we call calendar.refetchEvents()
    events: function(info, successCallback) {
      const filtered = allEvents.filter(e => activeCalendars.includes(e.sourceFile));
      successCallback(filtered);
    }
  });

  calendar.render();

  // 3. Add Toggle Logic to Legend Items
  legendItems.forEach(item => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-id");
      
      if (activeCalendars.includes(id)) {
        // Hide it
        activeCalendars = activeCalendars.filter(file => file !== id);
        item.classList.add("hidden");
      } else {
        // Show it
        activeCalendars.push(id);
        item.classList.remove("hidden");
      }
      
      // Tell FullCalendar to re-run the 'events' function above
      calendar.refetchEvents();
    });
  });
});