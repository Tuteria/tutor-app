export const adapter = {
  async fetchTutorInfo(id: string) {
    const response = await fetch(`/api/get-tutor-info?tutor=${id}`);

    if (response.ok) {
      const { data } = await response.json();
      return data;
    }

    throw "Failed to tutor info";
  }
};