ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length CHECK (full_name IS NULL OR char_length(btrim(full_name)) BETWEEN 2 AND 100),
  ADD CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^01[0125][0-9]{8}$'),
  ADD CONSTRAINT profiles_avatar_url_length CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2048),
  ADD CONSTRAINT profiles_preferred_size_length CHECK (preferred_size IS NULL OR char_length(preferred_size) <= 20);

ALTER TABLE public.addresses
  ADD CONSTRAINT addresses_label_length CHECK (label IS NULL OR char_length(label) <= 50),
  ADD CONSTRAINT addresses_recipient_name_length CHECK (char_length(btrim(recipient_name)) BETWEEN 2 AND 100),
  ADD CONSTRAINT addresses_phone_format CHECK (phone ~ '^01[0125][0-9]{8}$'),
  ADD CONSTRAINT addresses_governorate_length CHECK (char_length(btrim(governorate)) BETWEEN 2 AND 60),
  ADD CONSTRAINT addresses_city_length CHECK (char_length(btrim(city)) BETWEEN 2 AND 100),
  ADD CONSTRAINT addresses_street_length CHECK (char_length(btrim(street_address)) BETWEEN 5 AND 300),
  ADD CONSTRAINT addresses_building_length CHECK (building_details IS NULL OR char_length(building_details) <= 200),
  ADD CONSTRAINT addresses_landmark_length CHECK (landmark IS NULL OR char_length(landmark) <= 200);

CREATE UNIQUE INDEX addresses_one_default_per_user
  ON public.addresses(user_id)
  WHERE is_default = true;