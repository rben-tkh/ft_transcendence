import { IsString } from 'class-validator';

export class FormDataDto {
  @IsString()
  private name: string = "ok";

  @IsString()
  private password: string = "ok";

  @IsString()
  private capacity: string = "ok";

  @IsString()
  private description: string = "ok";

  setName(newName: string): void {
    this.name = newName;
  }
  setPassword(newPassword: string): void {
    this.password = newPassword;
  }
  setCapacity(newCapacity: string): void {
    this.capacity = newCapacity;
  }
  setDescription(newDescription: string): void {
    this.description = newDescription;
  }
  getResponse(pfp: string, capacity: number): {name: string, password: string, capacity: string, description: string} | {pfp: string, capacity: number} {
	if (this.name === "ok" && this.password === "ok" && this.capacity === "ok" && this.description === "ok")
      return ({pfp: pfp, capacity: capacity});
    return {name: this.name, password: this.password, capacity: this.capacity, description: this.description};
  }
}
