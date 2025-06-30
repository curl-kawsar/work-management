import React from 'react';

const WorkOrderPage = ({ params }) => {
  const { id } = params;

  return <div>Work Order {id}</div>;
};

export default WorkOrderPage;