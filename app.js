document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("calendar");

  // 👇 DEFINE YOUR CALENDARS + COLOURS HERE
  const calendarConfigs = [
    { file: "calendar1.ics", color: "#CC4055" },
    { file: "calendar2.ics", color: "#83d6d3" },
    { file: "calendar3.ics", color: "#2d6bb3" },
    { file: "calendar4.ics", color: "#549665" }
  ];

  let allEvents = [];

  for (let config of calendarConfigs) {
    const response = await fetch(config.file);
    const text = await response.text();

    const jcalData = ICAL.parse(text);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    vevents.forEach(v => {
      const event = new ICAL.Event(v);
      const loc = v.getFirstPropertyValue('location') || '';

      // Base event
      allEvents.push({
        title: event.summary,
        start: event.startDate.toJSDate(),
        end: event.endDate ? event.endDate.toJSDate() : null,
        allDay: event.startDate.isDate,
        backgroundColor: config.color,
        borderColor: config.color,
        location: loc
      });

      // Recurring events expansion
      if (event.isRecurring()) {
        const expand = new ICAL.RecurExpansion({
          component: v,
          dtstart: event.startDate
        });

        let next;
        let count = 0;

        while ((next = expand.next()) && count < 200) {
          allEvents.push({
            title: event.summary,
            start: next.toJSDate(),
            end: event.duration
              ? new Date(next.toJSDate().getTime() + event.duration.toSeconds() * 1000)
              : null,
            backgroundColor: config.color,
            borderColor: config.color,
            location: loc
          });
          count++;
        }
      }
    });
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridDay", // 👈 DEFAULT DAY VIEW
    slotMinTime: "06:00:00", // EDITED
    slotMaxTime: "20:00:00",
    weekends: false,

    headerToolbar: {
      left: "prev today next",
      center: "title",
      right: "timeGridDay timeGridWeek"
    },

    buttonText: {
      timeGridDay: "Day",
      timeGridWeek: "Week"
    },

    height: "auto",
    nowIndicator: true,
    expandRows: true,
    dayHeaderFormat: {weekday: 'short', day: 'numeric'},

    eventContent: function(arg) {
      let loc = arg.event.extendedProps.location || '';
      return { 
        html: '<b>' + arg.event.title + '</b>' + (loc ? '<br/>' + loc : '') 
      };
    },

    events: allEvents
  });

  calendar.render();
});