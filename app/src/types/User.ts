export type User = {
  uid: string; // uid de Firebase Authentication (dueño de las tareas, Task.userId)
  email: string; // correo con el que se registró/inició sesión
  createdAt: string; // ISO date, provista por Firebase (metadata.creationTime)
};
