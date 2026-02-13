-- Add event_count to contacts_view so CRM can show event sign-in count per contact
CREATE OR REPLACE VIEW contacts_view AS
SELECT 
  c.id as contact_id,
  cf.first_name,
  cl.last_name,
  ce.email,
  cp.phone,
  cs.source,
  cb.birthday,
  cha.home_anniversary,
  c.created_at as last_contact_at,
  c.updated_at,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ca.id,
        'address_line1', ca.address_line1,
        'address_line2', ca.address_line2,
        'city', ca.city,
        'state', ca.state,
        'zip_code', ca.zip_code,
        'country', ca.country,
        'is_primary', ca.is_primary
      )
    ) FILTER (WHERE ca.id IS NOT NULL),
    '[]'::json
  ) as addresses,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ct.id,
        'tag', ct.tag,
        'color', ct.color
      )
    ) FILTER (WHERE ct.id IS NOT NULL),
    '[]'::json
  ) as tags,
  (SELECT COUNT(*) FROM contact_messages cm WHERE cm.email_id = c.email_id OR cm.phone_id = c.phone_id) as message_count,
  (SELECT COUNT(*) FROM open_house_sign_ins ohs WHERE ohs.email_id = c.email_id OR ohs.phone_id = c.phone_id) as open_house_count,
  (SELECT COUNT(*) FROM event_sign_ins esi WHERE esi.is_active = TRUE AND (esi.email_id = c.email_id OR esi.phone_id = c.phone_id)) as event_count
FROM contacts c
LEFT JOIN contact_first_names cf ON c.first_name_id = cf.id
LEFT JOIN contact_last_names cl ON c.last_name_id = cl.id
LEFT JOIN contact_emails ce ON c.email_id = ce.id
LEFT JOIN contact_phones cp ON c.phone_id = cp.id
LEFT JOIN contact_sources cs ON c.source_id = cs.id
LEFT JOIN contact_birthdays cb ON c.id = cb.contact_id
LEFT JOIN contact_home_anniversaries cha ON c.id = cha.contact_id
LEFT JOIN contact_addresses ca ON c.id = ca.contact_id
LEFT JOIN contact_tag_assignments cta ON c.id = cta.contact_id
LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
WHERE c.is_active = TRUE
GROUP BY c.id, cf.first_name, cl.last_name, ce.email, cp.phone, cs.source, cb.birthday, cha.home_anniversary, c.created_at, c.updated_at;
