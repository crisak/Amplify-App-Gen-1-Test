import * as React from "react";
import { generateClient } from "aws-amplify/api";
import * as subscriptions from "./amplify/graphql/subscriptions";
import filterMutation from "./utils/filterMutation";

const client = generateClient();



export default function Subscriptions(props: any) {
  const [styleContainer, setStyleContainer] = React.useState<any>({
    border: "3px solid transparent",
  });
  const [events, setEvents] = React.useState([] as any[]);

  const [lastEvent, setLastEvent] = React.useState({
    type: "",
    event: {},
    time: "",
  });

  const timeoutStyle = () => {
    setStyleContainer({ border: "3px solid green", backgroundColor: '#00ff940f' });

    setTimeout(() => {
      setStyleContainer({ border: "3px solid transparent", backgroundColor: 'transparent' });
    }, 5000);
  };

  const handleEvent = (typeEvent: string, event: any) => {
    console.log(`[${typeEvent}] Event:`, event);

    timeoutStyle();

    setLastEvent({
      type: typeEvent,
      event,
      time: new Date().toLocaleString(),
    });

    setEvents([
      ...events,
      {
        type: typeEvent,
        event,
        time: new Date().toLocaleString(),
      },
    ]);
  };



  React.useEffect(() => {
    console.log("🚀 Subscribing...");
    // Subscribe to creation of Todo
    const onCreateOrder = client
      .graphql({
        query: subscriptions.onCreateOrder,
      })
      .subscribe({
        next: (data) => handleEvent("onCreateOrder", data),
        error: (error) => console.error('🔴 ERROR: ', error),
      });

    // Subscribe to update of Todo
    const updateSubFilter = client
      .graphql({
        query: subscriptions.onUpdateOrder, variables: {
          filter: {
            orderId: {
              eq: props.id
            }
          }
        }
      })
      .subscribe({
        next: (data) => handleEvent("onUpdateOrderByID", data),
        error: (error) => console.error('🔴 ERROR: ', error),
      });

    // Subscribe to update of Todo
    const onUpdateOrder = client
      .graphql({
        query: filterMutation({
          include: true,
          query: subscriptions.onUpdateOrder
        }, 'orderId', 'id', 'totals.name', 'invoices.invoiceKey'),
        authMode: 'apiKey'
      })
      .subscribe({
        next: (data) => handleEvent("onUpdateOrder", data),
        error: (error) => console.error('🔴 ERROR: ', error),
      });


    // Subscribe to deletion of Todo
    const onDeleteOrder = client
      .graphql({ query: subscriptions.onDeleteOrder })
      .subscribe({
        next: (data) => handleEvent("onDeleteOrder", data),
        error: (error) => console.error('🔴 ERROR: ', error),
      });


    /**
     * WEBHOOK
     */
    const onUpdateWebhook = client
      .graphql({ query: subscriptions.onUpdateWebhook })
      .subscribe({
        next: (data) => handleEvent("onUpdateWebhook", data),
        error: (error) => console.error('🔴 ERROR: ', error),
      });
    const onCreateWebhook = client
      .graphql({ query: subscriptions.onCreateWebhook })
      .subscribe({
        next: (data) => handleEvent("onCreateWebhook", data),
        error: (error) => console.error('🔴 ERROR: ', error),
      });

    return () => {
      console.log("🚷  Unsubscribing...");

      onCreateOrder?.unsubscribe();
      onUpdateOrder?.unsubscribe();
      updateSubFilter?.unsubscribe();
      onDeleteOrder?.unsubscribe();
      onUpdateWebhook?.unsubscribe();
      onCreateWebhook?.unsubscribe();
      // onUpdateOrderCustom?.unsubscribe();
    };
  }, []);

  return (
    <>
      <h3 >Listening to events</h3>
      <fieldset>
        <legend>
          Filters
        </legend>
        <div>
          On Create=<span style={{ color: 'gray' }}>{props.id}</span>
        </div>

      </fieldset>
      <br />

      <div
        style={{
          transition: 'all .5s',
          border: "3px solid transparent",
          backgroundColor: 'transparent',
          padding: "10px",
          ...styleContainer,
        }}
      >
        <h3>Last Event: {lastEvent.type}</h3>
        <p>Time: {lastEvent.time}</p>

        <pre style={{
          maxWidth: '90%',
          overflow: 'auto'
        }}>
          <code>
            {JSON.stringify(lastEvent.event, null, 2)}
          </code>
        </pre>
      </div>
      <br />
      <div>
        <h4>History Events</h4>
        <ul>
          {events.map((event) => (
            <li key={JSON.stringify(event)}>
              <p>[<span style={{ color: 'gray' }}>{event.time}</span>] Event: {event.type} </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
