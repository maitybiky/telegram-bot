class UserChoices {
  constructor() {
    this.choicesMap = new Map();
  }

  addGenre(userId, choice) {
    let userChoices = this.choicesMap.get(userId) || [];

    userChoices.push(choice);

    this.choicesMap.set(userId, userChoices);
  }
  removeGenre(userId, choiceToRemove) {
    let userChoices = this.choicesMap.get(userId);

    if (userChoices) {
      const index = userChoices.indexOf(choiceToRemove);
      if (index !== -1) {
        userChoices.splice(index, 1);

        this.choicesMap.set(userId, userChoices);
      }
    }
  }

  getUserGenre(userId) {
    return this.choicesMap.get(userId) || [];
  }
}

class Event {
  constructor() {
    this.events = [];
  }
  refreashEvent(data) {
    this.events = data;
  }
}
export const envEvent = new Event();
export const User = new UserChoices();
